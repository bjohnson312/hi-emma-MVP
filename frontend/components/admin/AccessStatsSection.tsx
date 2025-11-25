import { Activity, Users, TrendingUp, Calendar } from "lucide-react";

interface AccessStatsSectionProps {
  usageStats: {
    stats: {
      totalAccesses: number;
      totalUsers: number;
      todayAccesses: number;
      last7Days: number;
      last30Days: number;
      avgPerUser: number;
    };
  };
}

export function AccessStatsSection({ usageStats }: AccessStatsSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Access Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Activity className="w-8 h-8" />}
          title="Total Accesses"
          value={usageStats.stats.totalAccesses}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-8 h-8" />}
          title="Unique Users"
          value={usageStats.stats.totalUsers}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Today's Accesses"
          value={usageStats.stats.todayAccesses}
          color="green"
        />
        <StatCard
          icon={<Calendar className="w-8 h-8" />}
          title="Weekly Accesses"
          value={usageStats.stats.last7Days}
          color="orange"
        />
        <StatCard
          icon={<Calendar className="w-8 h-8" />}
          title="Monthly Accesses"
          value={usageStats.stats.last30Days}
          color="pink"
        />
        <StatCard
          icon={<Activity className="w-8 h-8" />}
          title="Avg Access/User"
          value={usageStats.stats.avgPerUser}
          color="teal"
          decimal
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, decimal = false }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
  decimal?: boolean;
}) {
  const colorClasses = {
    purple: "from-purple-600 to-purple-800",
    green: "from-green-600 to-green-800",
    blue: "from-blue-600 to-blue-800",
    orange: "from-orange-600 to-orange-800",
    pink: "from-pink-600 to-pink-800",
    teal: "from-teal-600 to-teal-800",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-6 text-white`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold">
            {decimal ? value.toFixed(1) : value.toLocaleString()}
          </p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}
