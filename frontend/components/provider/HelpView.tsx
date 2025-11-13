import { HelpCircle, Book, MessageCircle, FileText, Video, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FAQ_ITEMS = [
  {
    question: "How do I add a new patient to my care team?",
    answer: "Navigate to the Patients view and click the 'Add Patient' button. You'll need the patient's consent and their Hi, Emma account email address.",
  },
  {
    question: "What do the risk levels mean?",
    answer: "Risk levels are calculated based on medication adherence, mood trends, symptom escalation, and routine completion. High risk (7-10) requires immediate attention, medium risk (4-6) needs monitoring, and low risk (0-3) indicates stable condition.",
  },
  {
    question: "How is patient data protected?",
    answer: "All patient data is encrypted end-to-end and stored in HIPAA-compliant servers. We use industry-standard security protocols and regular audits to ensure data safety.",
  },
  {
    question: "Can I export patient data?",
    answer: "Yes, you can export individual patient reports or population-level analytics in CSV format from the Analytics view. All exports are logged for compliance.",
  },
  {
    question: "How do automated Emma insights work?",
    answer: "Emma AI analyzes patient check-ins, mood logs, and adherence patterns to identify concerning trends. You'll receive automated notifications when intervention may be needed.",
  },
];

const RESOURCES = [
  {
    title: "Provider Quick Start Guide",
    description: "Learn the basics of the provider portal in 5 minutes",
    icon: Book,
    type: "PDF Guide",
  },
  {
    title: "Best Practices for Patient Care",
    description: "Using Emma's agents to improve patient outcomes",
    icon: FileText,
    type: "Article",
  },
  {
    title: "Video Tutorial: Care Team Management",
    description: "Step-by-step guide to managing your care team",
    icon: Video,
    type: "Video (12:30)",
  },
  {
    title: "HIPAA Compliance Overview",
    description: "Understanding data security and patient privacy",
    icon: Book,
    type: "Documentation",
  },
];

export default function HelpView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Help & Resources</h2>
        <p className="text-gray-600">Find answers and learn how to use the provider portal</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Contact Support
          </h3>
          <p className="text-sm text-gray-600 mt-1">Need help? Our support team is here for you</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <Mail className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
              <p className="text-sm text-gray-600 mb-3">support@hiemma.com</p>
              <Button variant="outline" size="sm" className="w-full">
                Send Email
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Live Chat</h4>
              <p className="text-sm text-gray-600 mb-3">Available 24/7</p>
              <Button variant="outline" size="sm" className="w-full">
                Start Chat
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <HelpCircle className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Submit Ticket</h4>
              <p className="text-sm text-gray-600 mb-3">Technical issues</p>
              <Button variant="outline" size="sm" className="w-full">
                Create Ticket
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            Frequently Asked Questions
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {FAQ_ITEMS.map((faq, idx) => (
            <details key={idx} className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                {faq.question}
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-700">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Book className="w-5 h-5 text-green-600" />
            Learning Resources
          </h3>
          <p className="text-sm text-gray-600 mt-1">Guides and tutorials to help you get the most out of Hi, Emma</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESOURCES.map((resource, idx) => {
              const Icon = resource.icon;
              return (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-[#6656cb] transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#6656cb]/10 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-[#6656cb]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{resource.title}</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {resource.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Technical Onboarding</h3>
          <p className="text-sm text-gray-600 mt-1">Get started with the provider portal</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Set up your provider profile</h4>
                <p className="text-sm text-gray-600">Add your credentials, specialty, and contact information</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Connect with patients</h4>
                <p className="text-sm text-gray-600">Request patient access through the Patients view</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Configure your care team</h4>
                <p className="text-sm text-gray-600">Add team members and assign appropriate roles</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#6656cb] text-white flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Customize notification settings</h4>
                <p className="text-sm text-gray-600">Choose how you want to receive alerts and updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
