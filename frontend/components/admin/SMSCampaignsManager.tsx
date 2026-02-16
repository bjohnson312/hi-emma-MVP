import { useState, useEffect } from "react";
import { Plus, Power, Trash2, BarChart3, Clock, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { SMSCampaign, CampaignStats } from "~backend/sms_campaigns/types";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function SMSCampaignsManager() {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStats, setSelectedStats] = useState<CampaignStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    template_name: '',
    message_body: '',
    schedule_time: '09:00',
    target_user_ids: [] as string[],
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    loadCampaigns();
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await backend.admin_portal.listUsers();
      setUsers(response.users.map(u => ({ id: u.id, email: u.email, name: u.name })));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await backend.sms_campaigns.listCampaigns();
      setCampaigns(response.campaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreate = async () => {
    if (formData.target_user_ids.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one user to send to',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await backend.sms_campaigns.createCampaign(formData);
      
      if (response.success) {
        toast({ title: 'Success', description: 'Campaign created' });
        setShowCreateForm(false);
        setFormData({ name: '', template_name: '', message_body: '', schedule_time: '09:00', target_user_ids: [] });
        loadCampaigns();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create campaign',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    }
  };
  
  const toggleUserSelection = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      target_user_ids: prev.target_user_ids.includes(userId)
        ? prev.target_user_ids.filter(id => id !== userId)
        : [...prev.target_user_ids, userId]
    }));
  };
  
  const selectAllUsers = () => {
    setFormData(prev => ({
      ...prev,
      target_user_ids: users.map(u => u.id)
    }));
  };
  
  const clearAllUsers = () => {
    setFormData(prev => ({
      ...prev,
      target_user_ids: []
    }));
  };
  
  const handleToggle = async (id: number, is_active: boolean) => {
    try {
      const response = await backend.sms_campaigns.toggleCampaign({ id, is_active });
      
      if (response.success) {
        toast({
          title: is_active ? 'Campaign Activated' : 'Campaign Paused',
          description: `Campaign is now ${is_active ? 'active' : 'paused'}`,
        });
        loadCampaigns();
      }
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await backend.sms_campaigns.deleteCampaign({ id });
      toast({ title: 'Success', description: 'Campaign deleted' });
      loadCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };
  
  const loadStats = async (id: number) => {
    try {
      const response = await backend.sms_campaigns.getCampaignStats({ id });
      setSelectedStats(response.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign stats',
        variant: 'destructive',
      });
    }
  };
  
  const templates = [
    { name: 'Morning Greeting', time: '09:00', message: "Good morning! 🌅 Emma here. Ready to start your wellness journey today?" },
    { name: 'Daily Check-in', time: '10:00', message: "Hi! Time for your daily check-in. How are you feeling today?" },
    { name: 'Evening Reflection', time: '20:00', message: "Good evening! 🌙 Let's reflect on your day together." },
    { name: 'Weekly Wellness Tip', time: '11:00', message: "Your weekly wellness tip from Emma: Remember to stay hydrated! 💧" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled SMS Campaigns</h2>
          <p className="text-sm text-gray-500 mt-1">
            Automated daily SMS messages sent to users
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>
      
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Campaign</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => setFormData({
                  name: template.name,
                  template_name: template.name.toLowerCase().replace(/\s+/g, '_'),
                  message_body: template.message,
                  schedule_time: template.time,
                  target_user_ids: formData.target_user_ids,
                })}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {template.time}
                </div>
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Morning Greeting"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Template Name (Unique ID)</label>
              <Input
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="morning_greeting"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Schedule Time</label>
              <Input
                type="time"
                value={formData.schedule_time}
                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={formData.message_body}
                onChange={(e) => setFormData({ ...formData, message_body: e.target.value })}
                rows={4}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your message..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.message_body.length} / 160 characters
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Select Users to Send To <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllUsers}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllUsers}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              {loadingUsers ? (
                <div className="text-sm text-gray-500 p-4 border rounded-lg">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border rounded-lg">
                  No users found
                </div>
              ) : (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={formData.target_user_ids.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              <div className="mt-2 text-sm text-gray-600">
                {formData.target_user_ids.length} user{formData.target_user_ids.length !== 1 ? 's' : ''} selected
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreate} 
                className="flex-1"
                disabled={formData.target_user_ids.length === 0}
              >
                Create Campaign
              </Button>
              <Button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', template_name: '', message_body: '', schedule_time: '09:00', target_user_ids: [] });
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No campaigns yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        campaign.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      {campaign.message_body}
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Daily at {campaign.schedule_time.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.target_user_ids ? `${campaign.target_user_ids.length} users` : 'All users'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => loadStats(campaign.id)}
                      variant="outline"
                      size="sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleToggle(campaign.id, !campaign.is_active)}
                      variant="outline"
                      size="sm"
                    >
                      <Power className={`w-4 h-4 ${campaign.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                    </Button>
                    
                    <Button
                      onClick={() => handleDelete(campaign.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Campaign Statistics</h3>
            <Button onClick={() => setSelectedStats(null)} variant="outline" size="sm">
              Close
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Sends</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {selectedStats.total_sends}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Sent Today</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {selectedStats.sends_today}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Last Sent</div>
              <div className="text-sm font-medium text-purple-900 mt-1">
                {selectedStats.last_sent_at 
                  ? new Date(selectedStats.last_sent_at).toLocaleString()
                  : 'Never'}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Recent Sends</h4>
            <div className="space-y-2">
              {selectedStats.recent_sends.slice(0, 10).map((send, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="font-mono">{send.phone_number}</span>
                  <span className="text-gray-500">
                    {new Date(send.sent_at).toLocaleString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    send.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {send.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
