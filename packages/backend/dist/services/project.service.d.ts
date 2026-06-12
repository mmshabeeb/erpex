export declare function listProjects(filters: {
    status?: string;
    contactId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: {
        totalHours: number;
        billableHours: number;
        profitMargin: number;
        contact: {
            id: string;
            name: string;
            companyName: string | null;
        } | null;
        tasks: {
            id: string;
            name: string;
            createdAt: Date;
            status: string;
            description: string | null;
            projectId: string;
            hourlyRate: number;
            sortOrder: number;
            assignee: string | null;
            budgetHours: number;
            loggedHours: number;
        }[];
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        startDate: Date | null;
        endDate: Date | null;
        status: string;
        description: string | null;
        branchId: string | null;
        budget: number;
        contactId: string | null;
        billingMethod: string;
        costToDate: number;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getProject(id: string): Promise<{
    contact: {
        id: string;
        name: string;
        companyName: string | null;
    } | null;
    tasks: {
        id: string;
        name: string;
        createdAt: Date;
        status: string;
        description: string | null;
        projectId: string;
        hourlyRate: number;
        sortOrder: number;
        assignee: string | null;
        budgetHours: number;
        loggedHours: number;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    description: string | null;
    branchId: string | null;
    budget: number;
    contactId: string | null;
    billingMethod: string;
    costToDate: number;
}>;
export declare function createProject(data: any): Promise<{
    contact: {
        id: string;
        name: string;
        companyName: string | null;
    } | null;
    tasks: {
        id: string;
        name: string;
        createdAt: Date;
        status: string;
        description: string | null;
        projectId: string;
        hourlyRate: number;
        sortOrder: number;
        assignee: string | null;
        budgetHours: number;
        loggedHours: number;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    description: string | null;
    branchId: string | null;
    budget: number;
    contactId: string | null;
    billingMethod: string;
    costToDate: number;
}>;
export declare function updateProject(id: string, data: any): Promise<{
    contact: {
        id: string;
        name: string;
        companyName: string | null;
    } | null;
    tasks: {
        id: string;
        name: string;
        createdAt: Date;
        status: string;
        description: string | null;
        projectId: string;
        hourlyRate: number;
        sortOrder: number;
        assignee: string | null;
        budgetHours: number;
        loggedHours: number;
    }[];
} & {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    companyId: string;
    startDate: Date | null;
    endDate: Date | null;
    status: string;
    description: string | null;
    branchId: string | null;
    budget: number;
    contactId: string | null;
    billingMethod: string;
    costToDate: number;
}>;
export declare function addTask(projectId: string, data: any): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    status: string;
    description: string | null;
    projectId: string;
    hourlyRate: number;
    sortOrder: number;
    assignee: string | null;
    budgetHours: number;
    loggedHours: number;
}>;
export declare function updateTask(taskId: string, data: any): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    status: string;
    description: string | null;
    projectId: string;
    hourlyRate: number;
    sortOrder: number;
    assignee: string | null;
    budgetHours: number;
    loggedHours: number;
}>;
export declare function listTimesheets(filters: {
    projectId?: string;
    userId?: string;
    approvalStatus?: string;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
}): Promise<{
    data: ({
        project: {
            id: string;
            name: string;
        };
        task: {
            id: string;
            name: string;
        } | null;
    } & {
        hours: number;
        id: string;
        createdAt: Date;
        companyId: string;
        userId: string | null;
        description: string | null;
        date: Date;
        isBillable: boolean;
        projectId: string;
        taskId: string | null;
        approvalStatus: string;
        hourlyRate: number;
        totalAmount: number;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function createTimesheet(data: any): Promise<{
    hours: number;
    id: string;
    createdAt: Date;
    companyId: string;
    userId: string | null;
    description: string | null;
    date: Date;
    isBillable: boolean;
    projectId: string;
    taskId: string | null;
    approvalStatus: string;
    hourlyRate: number;
    totalAmount: number;
}>;
export declare function approveTimesheet(id: string): Promise<{
    hours: number;
    id: string;
    createdAt: Date;
    companyId: string;
    userId: string | null;
    description: string | null;
    date: Date;
    isBillable: boolean;
    projectId: string;
    taskId: string | null;
    approvalStatus: string;
    hourlyRate: number;
    totalAmount: number;
}>;
export declare function rejectTimesheet(id: string): Promise<{
    hours: number;
    id: string;
    createdAt: Date;
    companyId: string;
    userId: string | null;
    description: string | null;
    date: Date;
    isBillable: boolean;
    projectId: string;
    taskId: string | null;
    approvalStatus: string;
    hourlyRate: number;
    totalAmount: number;
}>;
//# sourceMappingURL=project.service.d.ts.map