interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
  login_count?: number;
}

interface UserTableProps {
  users: User[];
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
  onResetPassword: (id: string) => void;
}

export function UserTable({ users, onDeactivate, onReactivate, onResetPassword }: UserTableProps) {
  if (!users || users.length === 0) {
    return <div className="text-gray-500 text-center py-8">No users found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="text-left p-3 font-semibold text-sm">Email</th>
            <th className="text-left p-3 font-semibold text-sm">Name</th>
            <th className="text-left p-3 font-semibold text-sm">Created</th>
            <th className="text-left p-3 font-semibold text-sm">Last Login</th>
            <th className="text-left p-3 font-semibold text-sm">Total Logins</th>
            <th className="text-left p-3 font-semibold text-sm">Status</th>
            <th className="text-left p-3 font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-sm">{user.email}</td>
              <td className="p-3 text-sm">{user.name}</td>
              <td className="p-3 text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="p-3 text-sm">
                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
              </td>
              <td className="p-3 text-sm">{user.login_count || 0}</td>
              <td className="p-3 text-sm">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="p-3 text-sm">
                <div className="flex gap-2">
                  {user.is_active ? (
                    <button
                      onClick={() => onDeactivate(user.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    onClick={() => onResetPassword(user.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  >
                    Reset Password
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
