import type { User } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export default function UsersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.users,
  });

  const userRows = (data?.users as User[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Registered Users</h1>
        <p className="text-muted-foreground text-sm mt-1">{userRows.length} total users</p>
      </div>
      {isLoading && (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">Loading users...</CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-6 text-sm text-destructive">Unable to load users right now.</CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRows.length ? (
                userRows.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{user.avatar}</div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{String(user.joinedAt).slice(0, 10)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
