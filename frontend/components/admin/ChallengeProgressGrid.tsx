import type { UserProgress } from "~backend/challenges/types";

interface Props {
  enrollments: UserProgress[];
  totalDays: number;
  userNames: Record<string, string>;
}

export default function ChallengeProgressGrid({ enrollments, totalDays, userNames }: Props) {
  if (enrollments.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No users enrolled in this challenge yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 pr-4 font-semibold text-gray-700 whitespace-nowrap">User</th>
            {Array.from({ length: totalDays }, (_, i) => (
              <th key={i + 1} className="px-2 py-2 text-center font-semibold text-gray-700 w-14">
                Day {i + 1}
              </th>
            ))}
            <th className="pl-4 py-2 text-center font-semibold text-gray-700">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {enrollments.map((enrollment) => {
            const repliedCount = enrollment.sends.filter(s => s.replied_at).length;
            const sentCount = enrollment.sends.filter(s => s.status === "sent").length;
            const label = userNames[enrollment.user_id] || enrollment.phone_number;

            return (
              <tr key={enrollment.enrollment_id} className={!enrollment.is_active ? "opacity-40" : ""}>
                <td className="py-2 pr-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-400 font-mono">{enrollment.phone_number}</div>
                  {!enrollment.is_active && (
                    <span className="text-xs text-red-500">unenrolled</span>
                  )}
                </td>

                {Array.from({ length: totalDays }, (_, i) => {
                  const day = i + 1;
                  const send = enrollment.sends.find(s => s.day_number === day);

                  if (!send || send.status === "pending") {
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        <span title="Not sent yet" className="inline-block w-8 h-8 rounded-full bg-gray-100 border border-gray-200" />
                      </td>
                    );
                  }

                  if (send.status === "failed") {
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        <span
                          title="Send failed"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 border border-red-300 text-red-600 text-xs font-bold"
                        >
                          ✕
                        </span>
                      </td>
                    );
                  }

                  if (send.replied_at) {
                    return (
                      <td key={day} className="px-2 py-2 text-center">
                        <span
                          title={`Replied: "${send.reply_body}"\n${new Date(send.replied_at).toLocaleString()}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500 border border-green-600 text-white text-xs font-bold cursor-help"
                        >
                          💬
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={day} className="px-2 py-2 text-center">
                      <span
                        title={`Sent: ${send.sent_at ? new Date(send.sent_at).toLocaleString() : ""}\nNo reply yet`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 border border-blue-300 text-blue-600 text-xs font-bold cursor-help"
                      >
                        📤
                      </span>
                    </td>
                  );
                })}

                <td className="pl-4 py-2 text-center whitespace-nowrap">
                  <div className="text-xs text-gray-500">
                    {sentCount}/{totalDays} sent
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {repliedCount} replied
                  </div>
                  {sentCount > 0 && (
                    <div className="mt-1 h-1.5 w-16 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(sentCount / totalDays) * 100}%` }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded-full bg-gray-100 border border-gray-200" />
          Not sent
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 border border-blue-300 text-blue-600 text-xs">📤</span>
          Sent (no reply)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 border border-green-600 text-white text-xs">💬</span>
          Replied
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 border border-red-300 text-red-600 text-xs">✕</span>
          Failed
        </div>
      </div>
    </div>
  );
}
