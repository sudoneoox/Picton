import { Skeleton } from "@/components/ui/skeleton";

export const DashboardStats = ({ loading, data }) => {
  const stats = [
    { title: "Pending Approvals", value: data?.pendingApprovals || 0 },
    { title: "Processed This Week", value: data?.processedThisWeek || 0 },
    { title: "Avg. Response Time", value: data?.avgResponseTime ? `${data.avgResponseTime}h` : '0h' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="border rounded-lg p-4 bg-background">
          <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          )}
        </div>
      ))}
    </div>
  );
};