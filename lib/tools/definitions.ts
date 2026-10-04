import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const aiToolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_household_summary",
    description: "Fetches an overview of the household: health score, pending bills count, overdue maintenance, low stock items, and open tasks.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_inventory",
    description: "Retrieves the current household pantry and grocery inventory with quantities, units, and categories.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description: "Optional filter by category (Groceries, Dairy, Cleaning, Spices, Medicines, etc.)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_low_stock_items",
    description: "Fetches items that are running low, below safety threshold, or depleting within the next 4 days.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_upcoming_bills",
    description: "Retrieves utility bills (electricity, water, gas, internet, maintenance) due in the household, sorted by due date.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        status: {
          type: SchemaType.STRING,
          description: "Filter by status: PENDING, PAID, or ALL (default PENDING)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_household_expenses",
    description: "Retrieves recent Indian household expenses, category breakdowns, and flags anomalies (e.g. high electricity bills).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        category: {
          type: SchemaType.STRING,
          description: "Optional expense category (Utilities, Groceries, Domestic Help, Maintenance, etc.)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_appliances",
    description: "Retrieves all household assets/appliances (AC, Refrigerator, RO, Washing Machine, Geyser, etc.) with health scores and risk status.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_maintenance_schedule",
    description: "Retrieves appliances that require servicing, filter replacement, or inspection (upcoming or overdue).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_family_members",
    description: "Retrieves family members, roles, availability, preferences, and delegated responsibilities.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_pending_tasks",
    description: "Retrieves pending household tasks, priorities, due dates, and assigned members.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        priority: {
          type: SchemaType.STRING,
          description: "Optional priority filter: URGENT, HIGH, MEDIUM, LOW",
        },
      },
      required: [],
    },
  },
  {
    name: "create_task",
    description: "Creates a new household task in the database.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Title of the task" },
        description: { type: SchemaType.STRING, description: "Detailed description" },
        priority: { type: SchemaType.STRING, description: "LOW, MEDIUM, HIGH, URGENT" },
        dueDate: { type: SchemaType.STRING, description: "Due date in YYYY-MM-DD" },
        category: { type: SchemaType.STRING, description: "Maintenance, Procurement, Chore, Bill Payment" },
        assignedMemberName: { type: SchemaType.STRING, description: "Optional name of family member to assign" },
      },
      required: ["title"],
    },
  },
  {
    name: "assign_task",
    description: "Assigns a specific household task to a family member.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: { type: SchemaType.STRING, description: "The ID of the task" },
        memberName: { type: SchemaType.STRING, description: "Name of the family member" },
      },
      required: ["taskId", "memberName"],
    },
  },
  {
    name: "update_inventory",
    description: "Updates the stock level or details of an existing inventory item in the database.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        itemId: { type: SchemaType.STRING, description: "The ID or name of the item" },
        newQuantity: { type: SchemaType.NUMBER, description: "The updated quantity" },
        notes: { type: SchemaType.STRING, description: "Reason or notes for update" },
      },
      required: ["itemId", "newQuantity"],
    },
  },
  {
    name: "schedule_maintenance",
    description: "Logs a scheduled maintenance or service date for a specific household appliance.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        assetNameOrId: { type: SchemaType.STRING, description: "Appliance name or ID (e.g. Daikin AC, Kent RO)" },
        serviceType: { type: SchemaType.STRING, description: "Deep Clean, Filter Replacement, Preventive, Repair" },
        serviceDate: { type: SchemaType.STRING, description: "Date in YYYY-MM-DD" },
        provider: { type: SchemaType.STRING, description: "Urban Company, Brand Service, Local Technician" },
      },
      required: ["assetNameOrId", "serviceType"],
    },
  },
  {
    name: "mark_bill_paid",
    description: "Marks a specific bill as paid and records the payment transaction in expenses.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        billIdOrTitle: { type: SchemaType.STRING, description: "The ID or title of the bill" },
        paymentMethod: { type: SchemaType.STRING, description: "UPI, Net Banking, Card, Cash" },
      },
      required: ["billIdOrTitle"],
    },
  },
  {
    name: "create_purchase_recommendation",
    description: "Creates an actionable procurement recommendation card for the user to review and buy.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        product: { type: SchemaType.STRING, description: "Product name" },
        quantity: { type: SchemaType.STRING, description: "Recommended quantity / pack size" },
        estimatedPrice: { type: SchemaType.NUMBER, description: "Estimated price in INR" },
        reason: { type: SchemaType.STRING, description: "Why this recommendation is made" },
        retailer: { type: SchemaType.STRING, description: "Blinkit, Zepto, Swiggy Instamart, Amazon" },
      },
      required: ["product", "quantity", "reason"],
    },
  },
];
