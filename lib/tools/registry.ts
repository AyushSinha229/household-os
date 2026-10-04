import { prisma } from "@/lib/db/prisma";
import { calculateDepletion } from "@/lib/services/inventory-calculator";
import { calculateAssetMaintenance } from "@/lib/services/maintenance-calculator";
import { logActivity } from "@/lib/services/activity-service";

export async function executeTool(name: string, args: Record<string, unknown> = {}) {
  // Ensure we have a household
  const household = await prisma.household.findFirst();
  const householdId = household?.id;
  if (!householdId) {
    return { error: "No household found in database" };
  }

  switch (name) {
    case "get_household_summary": {
      const [membersCount, lowStockItems, pendingBills, assets, pendingTasks] = await Promise.all([
        prisma.householdMember.count({ where: { householdId } }),
        prisma.inventoryItem.findMany({ where: { householdId, isLowStock: true } }),
        prisma.bill.findMany({ where: { householdId, paymentStatus: "PENDING" } }),
        prisma.asset.findMany({ where: { householdId } }),
        prisma.task.findMany({ where: { householdId, status: "PENDING" } }),
      ]);

      const overdueAssets = assets.filter((a) => {
        const status = calculateAssetMaintenance(a);
        return status.isOverdue;
      });

      const totalPendingBillAmount = pendingBills.reduce((acc, b) => acc + b.amount, 0);

      return {
        householdName: household.name,
        city: household.city,
        membersCount,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.map((i) => ({ name: i.name, quantity: `${i.quantity} ${i.unit}`, daysRemaining: i.estimatedDaysRemaining })),
        pendingBillsCount: pendingBills.length,
        totalPendingBillAmount,
        upcomingBills: pendingBills.map((b) => ({ title: b.title, amount: `₹${b.amount}`, dueDate: b.dueDate.toISOString().split("T")[0] })),
        totalAppliancesTracked: assets.length,
        overdueMaintenanceCount: overdueAssets.length,
        overdueAppliances: overdueAssets.map((a) => a.name),
        pendingTasksCount: pendingTasks.length,
      };
    }

    case "get_inventory": {
      const category = args.category as string | undefined;
      const whereClause = category
        ? { householdId, category: { contains: category } }
        : { householdId };
      const items = await prisma.inventoryItem.findMany({
        where: whereClause,
        orderBy: { estimatedDaysRemaining: "asc" },
      });
      return items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        minimumStock: i.minimumStock,
        estimatedDaysRemaining: i.estimatedDaysRemaining,
        isLowStock: i.isLowStock,
        preferredBrand: i.preferredBrand,
        preferredPackSize: i.preferredPackSize,
        price: i.price,
        vendor: i.vendor,
      }));
    }

    case "get_low_stock_items": {
      const items = await prisma.inventoryItem.findMany({
        where: {
          householdId,
          OR: [{ isLowStock: true }, { estimatedDaysRemaining: { lte: 4 } }],
        },
        orderBy: { estimatedDaysRemaining: "asc" },
      });
      return items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        currentStock: `${i.quantity} ${i.unit}`,
        minimumStock: `${i.minimumStock} ${i.unit}`,
        consumptionRate: `${i.consumptionRate} ${i.unit}/day`,
        estimatedDaysRemaining: i.estimatedDaysRemaining,
        preferredPackSize: i.preferredPackSize,
        preferredBrand: i.preferredBrand,
        estimatedPrice: `₹${i.price}`,
        vendor: i.vendor,
      }));
    }

    case "get_upcoming_bills": {
      const status = (args.status as string) || "PENDING";
      const whereClause: { householdId: string; paymentStatus?: string } = { householdId };
      if (status !== "ALL") {
        whereClause.paymentStatus = status;
      }
      const bills = await prisma.bill.findMany({
        where: whereClause,
        orderBy: { dueDate: "asc" },
      });
      return bills.map((b) => ({
        id: b.id,
        title: b.title,
        provider: b.provider,
        category: b.category,
        amount: b.amount,
        formattedAmount: `₹${b.amount.toLocaleString("en-IN")}`,
        dueDate: b.dueDate.toISOString().split("T")[0],
        status: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        autoPay: b.autoPay,
        notes: b.notes,
      }));
    }

    case "get_household_expenses": {
      const category = args.category as string | undefined;
      const whereClause = category
        ? { householdId, category: { contains: category } }
        : { householdId };
      const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        take: 15,
      });
      return expenses.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        amount: e.amount,
        formattedAmount: `₹${e.amount.toLocaleString("en-IN")}`,
        date: e.date.toISOString().split("T")[0],
        paidBy: e.paidBy,
        paymentMethod: e.paymentMethod,
        isAnomaly: e.isAnomaly,
        anomalyReason: e.anomalyReason,
      }));
    }

    case "get_appliances": {
      const assets = await prisma.asset.findMany({
        where: { householdId },
        orderBy: { healthScore: "asc" },
      });
      return assets.map((a) => {
        const maintenance = calculateAssetMaintenance(a);
        return {
          id: a.id,
          name: a.name,
          category: a.category,
          brand: a.brand,
          location: a.location,
          healthScore: maintenance.healthScore,
          riskLevel: maintenance.riskLevel,
          daysSinceLastService: maintenance.daysSinceLastService,
          daysUntilNextService: maintenance.daysUntilNextService,
          isOverdue: maintenance.isOverdue,
          warrantyStatus: maintenance.warrantyStatus.label,
          explanation: maintenance.explanation,
        };
      });
    }

    case "get_maintenance_schedule": {
      const assets = await prisma.asset.findMany({
        where: { householdId },
      });
      const schedules = assets.map((a) => calculateAssetMaintenance(a));
      return schedules.sort((a, b) => a.daysUntilNextService - b.daysUntilNextService);
    }

    case "get_family_members": {
      const members = await prisma.householdMember.findMany({
        where: { householdId },
        include: {
          tasks: {
            where: { status: "PENDING" },
            select: { id: true, title: true, priority: true },
          },
        },
      });
      return members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        phone: m.phone,
        availability: m.availability,
        responsibilities: m.responsibilities,
        preferences: m.preferences,
        pendingTasksCount: m.tasks.length,
        currentTasks: m.tasks.map((t) => t.title),
      }));
    }

    case "get_pending_tasks": {
      const priority = args.priority as string | undefined;
      const whereClause: { householdId: string; status: string; priority?: string } = {
        householdId,
        status: "PENDING",
      };
      if (priority) whereClause.priority = priority;

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: { assignedMember: { select: { name: true } } },
        orderBy: { priority: "desc" },
      });
      return tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString().split("T")[0] || "No date set",
        assignedTo: t.assignedMember?.name || "Unassigned",
        category: t.category,
        aiRecommendation: t.aiReason,
      }));
    }

    case "create_task": {
      const title = args.title as string;
      const description = (args.description as string) || null;
      const priority = (args.priority as string) || "MEDIUM";
      const category = (args.category as string) || "General";
      const dueDate = args.dueDate ? new Date(args.dueDate as string) : null;
      const assignedMemberName = args.assignedMemberName as string | undefined;

      let assignedMemberId: string | null = null;
      if (assignedMemberName) {
        const member = await prisma.householdMember.findFirst({
          where: { householdId, name: { contains: assignedMemberName } },
        });
        if (member) assignedMemberId = member.id;
      }

      const task = await prisma.task.create({
        data: {
          householdId,
          title,
          description,
          priority,
          category,
          dueDate,
          assignedMemberId,
        },
      });

      await logActivity({
        householdId,
        actionType: "TASK_ASSIGNED",
        title: `Task created: ${title}`,
        description: assignedMemberName ? `Assigned to ${assignedMemberName}` : "Added to pending household tasks",
        entityType: "Task",
        entityId: task.id,
        actor: "AI Assistant",
      });

      return {
        success: true,
        message: `Task "${title}" created successfully in the household planner.`,
        task,
      };
    }

    case "assign_task": {
      const taskId = args.taskId as string;
      const memberName = args.memberName as string;

      const member = await prisma.householdMember.findFirst({
        where: { householdId, name: { contains: memberName } },
      });

      if (!member) {
        return { error: `Family member "${memberName}" not found in this household.` };
      }

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: { assignedMemberId: member.id },
      });

      await logActivity({
        householdId,
        actionType: "TASK_ASSIGNED",
        title: `Task reassigned: ${updated.title}`,
        description: `Handed over to ${member.name}`,
        entityType: "Task",
        entityId: updated.id,
        actor: "AI Assistant",
      });

      return {
        success: true,
        message: `Task "${updated.title}" assigned to ${member.name}.`,
      };
    }

    case "update_inventory": {
      const itemId = args.itemId as string;
      const newQuantity = Number(args.newQuantity);
      const notes = (args.notes as string) || "Updated by AI Assistant";

      const item = await prisma.inventoryItem.findFirst({
        where: {
          householdId,
          OR: [{ id: itemId }, { name: { contains: itemId } }],
        },
      });

      if (!item) return { error: `Inventory item "${itemId}" not found.` };

      const diff = newQuantity - item.quantity;
      const depletion = calculateDepletion(newQuantity, item.minimumStock, item.consumptionRate);

      const updated = await prisma.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: newQuantity,
          estimatedDaysRemaining: depletion.estimatedDaysRemaining,
          isLowStock: depletion.isLowStock,
        },
      });

      await prisma.inventoryEvent.create({
        data: {
          itemId: updated.id,
          type: diff >= 0 ? "RESTOCK" : "CONSUMPTION",
          quantityChanged: diff,
          newQuantity,
          notes,
        },
      });

      await logActivity({
        householdId,
        actionType: "INVENTORY_UPDATED",
        title: `Updated stock: ${item.name}`,
        description: `New stock level: ${newQuantity} ${item.unit} (~${depletion.estimatedDaysRemaining} days remaining)`,
        entityType: "Inventory",
        entityId: item.id,
        actor: "AI Assistant",
      });

      return {
        success: true,
        message: `Inventory for ${item.name} updated to ${newQuantity} ${item.unit}. Estimated days remaining: ${depletion.estimatedDaysRemaining} days.`,
        item: updated,
      };
    }

    case "schedule_maintenance": {
      const assetNameOrId = args.assetNameOrId as string;
      const serviceType = (args.serviceType as string) || "Preventive";
      const serviceDate = args.serviceDate ? new Date(args.serviceDate as string) : new Date();
      const provider = (args.provider as string) || "Urban Company";

      const asset = await prisma.asset.findFirst({
        where: {
          householdId,
          OR: [{ id: assetNameOrId }, { name: { contains: assetNameOrId } }],
        },
      });

      if (!asset) return { error: `Appliance "${assetNameOrId}" not found.` };

      // Log maintenance record
      const record = await prisma.maintenanceRecord.create({
        data: {
          assetId: asset.id,
          serviceDate,
          serviceType,
          provider,
          notes: `Scheduled via Household OS assistant.`,
        },
      });

      // Update asset health & next due date
      const nextDue = new Date(serviceDate.getTime() + asset.serviceIntervalDays * 24 * 3600 * 1000);
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          lastServiceDate: serviceDate,
          nextServiceDueDate: nextDue,
          healthScore: 95,
          riskLevel: "Good",
        },
      });

      await logActivity({
        householdId,
        actionType: "MAINTENANCE_SCHEDULED",
        title: `Service logged: ${asset.name}`,
        description: `${serviceType} by ${provider} on ${serviceDate.toISOString().split("T")[0]}`,
        entityType: "Asset",
        entityId: asset.id,
        actor: "AI Assistant",
      });

      return {
        success: true,
        message: `Maintenance recorded for ${asset.name}. Next service scheduled for ${nextDue.toISOString().split("T")[0]}. Appliance health restored to 95%.`,
        record,
      };
    }

    case "mark_bill_paid": {
      const billIdOrTitle = args.billIdOrTitle as string;
      const paymentMethod = (args.paymentMethod as string) || "UPI";

      const bill = await prisma.bill.findFirst({
        where: {
          householdId,
          OR: [{ id: billIdOrTitle }, { title: { contains: billIdOrTitle } }],
        },
      });

      if (!bill) return { error: `Bill "${billIdOrTitle}" not found.` };

      const updated = await prisma.bill.update({
        where: { id: bill.id },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          paymentMethod,
        },
      });

      // Also create an Expense entry
      await prisma.expense.create({
        data: {
          householdId,
          title: `Bill Paid: ${bill.title}`,
          category: bill.category === "Electricity" || bill.category === "Gas/LPG" || bill.category === "Water" ? "Utilities" : bill.category,
          amount: bill.amount,
          paymentMethod,
          paidBy: "Ayush Sharma",
          vendor: bill.provider,
          isAnomaly: false,
        },
      });

      await logActivity({
        householdId,
        actionType: "BILL_PAID",
        title: `Bill Paid: ${bill.title}`,
        description: `Amount of ₹${bill.amount.toLocaleString("en-IN")} settled via ${paymentMethod}`,
        entityType: "Bill",
        entityId: bill.id,
        actor: "AI Assistant",
      });

      return {
        success: true,
        message: `Bill "${bill.title}" marked as PAID (₹${bill.amount.toLocaleString("en-IN")}) via ${paymentMethod}.`,
      };
    }

    case "create_purchase_recommendation": {
      const product = args.product as string;
      const quantity = args.quantity as string;
      const estimatedPrice = Number(args.estimatedPrice) || 0;
      const reason = args.reason as string;
      const retailer = (args.retailer as string) || "Blinkit";

      const rec = await prisma.recommendation.create({
        data: {
          householdId,
          type: "PROCUREMENT",
          title: `Restock ${product} (${quantity})`,
          description: `Recommended purchase for household pantry`,
          reason,
          urgency: "HIGH",
          status: "PENDING",
          estimatedCost: estimatedPrice,
          metadata: JSON.stringify({
            product,
            quantity,
            estimatedPrice,
            retailer,
            retailerUrl: `https://${retailer.toLowerCase().includes("zepto") ? "zeptonow.com" : "blinkit.com"}/s/?q=${encodeURIComponent(product)}`,
          }),
        },
      });

      await logActivity({
        householdId,
        actionType: "RECOMMENDATION_APPROVED",
        title: `Procurement recommendation generated`,
        description: `Added "${product}" to shopping list recommendations`,
        entityType: "Recommendation",
        entityId: rec.id,
        actor: "AI Assistant",
      });

      return {
        success: true,
        message: `Recommendation created for ${product} (${quantity}) at ₹${estimatedPrice} on ${retailer}.`,
        recommendation: rec,
      };
    }

    default:
      return { error: `Tool ${name} is not recognized` };
  }
}
