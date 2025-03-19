import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell
  } from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { StatusBadge } from "@/components/StatusBadge";
  
  export const RecentSubmissions = ({ submissions, loading }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Last 10 processed requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Type</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                submissions?.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.form_template?.name}</TableCell>
                    <TableCell>{submission.submitter?.username}</TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };