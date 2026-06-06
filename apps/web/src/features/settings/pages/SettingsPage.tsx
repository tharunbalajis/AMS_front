import { Card } from "@ams/ui";
import { Bell, Database, Download, FileText, Globe, Key, Lock, Mail, Save, Server, Shield, Upload, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const SECTIONS: Section[] = [
  { id: "general",       label: "General",                icon: <Globe size={16} /> },
  { id: "profile",       label: "User Preferences",       icon: <User size={16} /> },
  { id: "security",      label: "Security",               icon: <Lock size={16} /> },
  { id: "email",         label: "Email / SMTP",           icon: <Mail size={16} /> },
  { id: "notifications", label: "Notifications",          icon: <Bell size={16} /> },
  { id: "system",        label: "System",                 icon: <Server size={16} /> },
  { id: "storage",       label: "Storage",                icon: <Database size={16} /> },
  { id: "backup",        label: "Backup & Restore",       icon: <Download size={16} /> },
  { id: "import-export", label: "Import & Export",        icon: <Upload size={16} /> },
  { id: "audit",         label: "Audit",                  icon: <FileText size={16} /> },
  { id: "templates",     label: "Notification Templates", icon: <Bell size={16} /> }
];

// ─── Field helpers ────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({ label, hint, type = "text", defaultValue, placeholder }: { label: string; hint?: string; type?: string; defaultValue?: string | number; placeholder?: string }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </Field>
  );
}

function SelectField({ label, hint, options, defaultValue }: { label: string; hint?: string; options: string[]; defaultValue?: string }) {
  return (
    <Field label={label} hint={hint}>
      <select defaultValue={defaultValue} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function Toggle({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn(v => !v)}
        className={`relative mt-0.5 h-5 w-9 rounded-full transition-colors ${on ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5 border-b border-gray-100 pb-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}

function SaveButton({ section }: { section: string }) {
  function save() { toast.success(`${section} settings saved`); }
  return (
    <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={save}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Save size={15} /> Save Changes
      </button>
    </div>
  );
}

// ─── Section Panels ───────────────────────────────────────────────────────────
function GeneralPanel() {
  return (
    <div>
      <SectionHeader title="General Settings" desc="Organization name, contact details, localization, and display preferences." />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Organization Name" defaultValue="AMS" placeholder="Society / Organization Name" />
        <Input label="Contact Email" type="email" defaultValue="admin@sakthiams.com" />
        <Input label="Contact Phone" defaultValue="+91 9876543210" />
        <Input label="Address" defaultValue="123, Sakthi Nagar, Chennai - 600001" />
        <SelectField label="Timezone" options={["Asia/Kolkata", "UTC", "Asia/Dubai", "Europe/London", "America/New_York"]} defaultValue="Asia/Kolkata" />
        <SelectField label="Date Format" options={["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"]} defaultValue="DD-MM-YYYY" />
        <SelectField label="Currency" options={["INR (₹)", "USD ($)", "EUR (€)", "AED (د.إ)"]} defaultValue="INR (₹)" />
        <SelectField label="Language" options={["English", "Tamil", "Hindi", "Telugu", "Kannada"]} defaultValue="English" />
      </div>
      <SaveButton section="General" />
    </div>
  );
}

function ProfilePanel() {
  return (
    <div>
      <SectionHeader title="User Preferences" desc="Update your profile, change password, and configure notification preferences." />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Full Name" defaultValue="Admin User" />
        <Input label="Email" type="email" defaultValue="admin@sakthiams.com" />
        <Input label="Mobile" defaultValue="+91 9876543210" />
        <SelectField label="Theme" options={["Light", "Dark", "System"]} defaultValue="Light" />
      </div>
      <div className="mt-5 border-t border-gray-100 pt-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Change Password</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="Min. 8 characters" />
          <Input label="Confirm New Password" type="password" placeholder="Repeat new password" />
        </div>
      </div>
      <SaveButton section="Profile" />
    </div>
  );
}

function SecurityPanel() {
  return (
    <div>
      <SectionHeader title="Security Settings" desc="Control authentication, session management, and two-factor authentication." />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="JWT Expiry (minutes)" type="number" defaultValue={15} hint="Access token lifetime in minutes." />
        <Input label="Refresh Token Expiry (days)" type="number" defaultValue={7} hint="Refresh token lifetime in days." />
        <Input label="Session Timeout (minutes)" type="number" defaultValue={60} hint="Idle session timeout before auto-logout." />
        <Input label="Max Login Attempts" type="number" defaultValue={5} hint="Account locks after this many failed attempts." />
      </div>
      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <Toggle label="Enable Two-Factor Authentication (2FA)" hint="Require OTP on login." defaultChecked={false} />
        <Toggle label="Log All API Requests" hint="Write request/response details to audit logs." defaultChecked={true} />
        <Toggle label="Force HTTPS" hint="Redirect all HTTP traffic to HTTPS." defaultChecked={true} />
      </div>
      <SaveButton section="Security" />
    </div>
  );
}

function EmailPanel() {
  return (
    <div>
      <SectionHeader title="Email / SMTP Configuration" desc="Configure SMTP credentials for sending system emails and notifications." />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="SMTP Host" defaultValue="smtp.gmail.com" placeholder="smtp.provider.com" />
        <Input label="SMTP Port" type="number" defaultValue={587} />
        <Input label="SMTP Username" defaultValue="admin@sakthiams.com" />
        <Input label="SMTP Password" type="password" placeholder="App password or token" />
        <Input label="From Email" type="email" defaultValue="noreply@sakthiams.com" />
        <Input label="From Name" defaultValue="AMS" />
      </div>
      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <Toggle label="Enable TLS" defaultChecked={true} />
        <Toggle label="Send Test Email on Save" defaultChecked={false} />
      </div>
      <SaveButton section="Email / SMTP" />
    </div>
  );
}

function NotificationsPanel() {
  return (
    <div>
      <SectionHeader title="Notifications" desc="Control which system events send email or in-app notifications." />
      <div className="space-y-4">
        <Toggle label="New Resident Registration" hint="Notify admin when a new resident is added." defaultChecked={true} />
        <Toggle label="Complaint Raised" hint="Notify assigned staff when a complaint is filed." defaultChecked={true} />
        <Toggle label="Complaint Resolved" hint="Notify resident when their complaint is resolved." defaultChecked={true} />
        <Toggle label="Invoice Due Reminder" hint="Send payment due reminders 3 days before due date." defaultChecked={true} />
        <Toggle label="Overdue Payment Alert" hint="Alert finance team on overdue invoices." defaultChecked={true} />
        <Toggle label="Visitor Check-In Alert" hint="Notify resident when their visitor is checked in." defaultChecked={false} />
        <Toggle label="SOS Emergency Alert" hint="Broadcast SOS alerts to all admins." defaultChecked={true} />
        <Toggle label="Maintenance Schedule Reminder" hint="Remind staff 1 day before scheduled maintenance." defaultChecked={true} />
      </div>
      <SaveButton section="Notifications" />
    </div>
  );
}

function SystemPanel() {
  return (
    <div>
      <SectionHeader title="System Settings" desc="Configure server, API, logging, and performance settings." />
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="API Rate Limit (req/min)" type="number" defaultValue={100} hint="Maximum API requests per minute per client." />
        <SelectField label="Log Level" options={["debug", "info", "warn", "error"]} defaultValue="info" />
        <Input label="Pagination Limit (default)" type="number" defaultValue={25} hint="Default page size for list endpoints." />
        <SelectField label="Environment" options={["production", "staging", "development"]} defaultValue="production" />
      </div>
      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <Toggle label="Enable API Documentation (Swagger)" defaultChecked={true} hint="Accessible at /docs." />
        <Toggle label="Enable Health Check Endpoint" defaultChecked={true} hint="GET /health returns server status." />
        <Toggle label="Enable Metrics Endpoint" defaultChecked={true} hint="GET /metrics for Prometheus scraping." />
      </div>
      <SaveButton section="System" />
    </div>
  );
}

function StoragePanel() {
  return (
    <div>
      <SectionHeader title="Storage Configuration" desc="Configure file storage provider for documents, QR codes, and media." />
      <div className="grid gap-5 md:grid-cols-2">
        <SelectField label="Storage Provider" options={["Local Filesystem", "Google Cloud Storage (GCP)", "Amazon S3", "Azure Blob"]} defaultValue="Local Filesystem" />
        <Input label="Max File Size (MB)" type="number" defaultValue={10} hint="Maximum allowed file upload size." />
        <Input label="GCP Bucket Name" placeholder="my-ams-bucket" />
        <Input label="GCP Project ID" placeholder="my-gcp-project-id" />
        <Input label="S3 Bucket Name" placeholder="my-s3-bucket" />
        <SelectField label="S3 Region" options={["ap-south-1", "us-east-1", "eu-west-1"]} defaultValue="ap-south-1" />
      </div>
      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <Toggle label="Compress Images on Upload" defaultChecked={true} hint="Reduce storage usage by compressing uploaded images." />
        <Toggle label="Generate CDN URLs" defaultChecked={false} hint="Use CDN-backed URLs for faster media delivery." />
      </div>
      <SaveButton section="Storage" />
    </div>
  );
}

function BackupPanel() {
  return (
    <div>
      <SectionHeader title="Backup & Restore" desc="Schedule automatic backups and restore system state." />
      <div className="grid gap-5 md:grid-cols-2">
        <Toggle label="Enable Scheduled Backups" defaultChecked={true} />
        <SelectField label="Backup Frequency" options={["Daily", "Weekly", "Monthly"]} defaultValue="Daily" />
        <Input label="Backup Retention (days)" type="number" defaultValue={30} hint="Automatically delete backups older than this." />
        <Input label="Backup Storage Path" defaultValue="/backups" hint="Local or remote path for backup files." />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => toast.success("Backup started — you'll be notified when complete.")}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Download size={15} /> Backup Now
        </button>
        <button
          type="button"
          onClick={() => toast.info("Select a backup file to restore from.")}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Upload size={15} /> Restore Backup
        </button>
      </div>
      <SaveButton section="Backup" />
    </div>
  );
}

function ImportExportPanel() {
  return (
    <div>
      <SectionHeader title="Import & Export" desc="Bulk import or export system data across all modules." />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Residents", hint: "Import/export resident profiles" },
          { label: "Units", hint: "Import/export unit data" },
          { label: "Staff", hint: "Import/export staff records" },
          { label: "Finance", hint: "Import/export invoices and payments" },
          { label: "Complaints", hint: "Export complaint history" },
          { label: "Visitors", hint: "Export visitor logs" }
        ].map(m => (
          <div key={m.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-700">{m.label}</p>
              <p className="text-xs text-gray-400">{m.hint}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toast.info(`Import ${m.label} — upload CSV/Excel file.`)}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white"
              >
                <Upload size={12} /> Import
              </button>
              <button
                type="button"
                onClick={() => toast.success(`${m.label} export started.`)}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                <Download size={12} /> Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditPanel() {
  return (
    <div>
      <SectionHeader title="Audit Configuration" desc="Configure what is tracked in the audit log system." />
      <div className="space-y-4">
        <Toggle label="Log User Logins & Logouts" defaultChecked={true} />
        <Toggle label="Log Role & Permission Changes" defaultChecked={true} />
        <Toggle label="Log Resident Updates" defaultChecked={true} />
        <Toggle label="Log Financial Transactions" defaultChecked={true} />
        <Toggle label="Log Data Exports" defaultChecked={true} />
        <Toggle label="Log API Errors" defaultChecked={true} />
        <Toggle label="Retain Audit Logs (90 days)" defaultChecked={true} hint="Older entries are auto-purged to manage storage." />
      </div>
      <SaveButton section="Audit" />
    </div>
  );
}

function TemplatesPanel() {
  const templates = [
    { id: "welcome", label: "Welcome Email", desc: "Sent when a new user is registered" },
    { id: "invoice", label: "Invoice Notification", desc: "Sent when an invoice is generated" },
    { id: "complaint", label: "Complaint Acknowledgement", desc: "Sent when a complaint is filed" },
    { id: "overdue", label: "Overdue Payment Reminder", desc: "Sent when payment is overdue" },
    { id: "otp", label: "OTP / 2FA Email", desc: "Sent for two-factor authentication" },
    { id: "visitor", label: "Visitor Pre-approval", desc: "Sent to resident to confirm visitor" }
  ];
  return (
    <div>
      <SectionHeader title="Notification Templates" desc="Edit email and in-app message templates for system events." />
      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-700">{t.label}</p>
              <p className="text-xs text-gray-400">{t.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => toast.info(`Opening template editor for: ${t.label}`)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Edit Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────
const PANEL_MAP: Record<string, React.ReactNode> = {
  general:       <GeneralPanel />,
  profile:       <ProfilePanel />,
  security:      <SecurityPanel />,
  email:         <EmailPanel />,
  notifications: <NotificationsPanel />,
  system:        <SystemPanel />,
  storage:       <StoragePanel />,
  backup:        <BackupPanel />,
  "import-export": <ImportExportPanel />,
  audit:         <AuditPanel />,
  templates:     <TemplatesPanel />
};

export function SettingsPage() {
  const [active, setActive] = useState("general");

  return (
    <div className="grid gap-5 xl:grid-cols-[240px_1fr]">
      {/* Sidebar nav */}
      <Card className="p-2">
        <div className="mb-3 flex items-center gap-2 px-3 py-2">
          <Shield size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Settings</span>
        </div>
        {SECTIONS.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActive(section.id)}
            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition ${
              active === section.id
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span className={active === section.id ? "text-blue-600" : "text-gray-400"}>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </Card>

      {/* Content */}
      <Card className="p-6">
        {PANEL_MAP[active]}
      </Card>
    </div>
  );
}
