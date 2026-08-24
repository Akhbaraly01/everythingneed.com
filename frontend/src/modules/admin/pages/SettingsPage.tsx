import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "../components/AdminLayout";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { Separator } from "@shared/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Loader2, Save, Settings, Shield, CreditCard, Mail, Cpu, Flag } from "lucide-react";
import { settingsApi, type FeatureFlag } from "../services";

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-700/40 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-300">{label}</p>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: settingsRes } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });

  const { data: flagsRes } = useQuery({
    queryKey: ["settings", "featureFlags"],
    queryFn: () => settingsApi.featureFlags(),
  });

  const settings = settingsRes?.data ?? {};
  const flags: FeatureFlag[] = flagsRes?.data ?? [];

  const updateSettings = useMutation({
    mutationFn: (items: { key: string; value: string | number | boolean }[]) => settingsApi.update(items),
    onSuccess: () => { toast.success("Settings saved"); queryClient.invalidateQueries({ queryKey: ["settings"] }); },
    onError: () => toast.error("Failed to save settings"),
  });

  const toggleFlagMut = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => settingsApi.toggleFlag(key, enabled),
    onSuccess: () => { toast.success("Feature flag updated"); queryClient.invalidateQueries({ queryKey: ["settings", "featureFlags"] }); },
    onError: () => toast.error("Failed to update flag"),
  });

  const handleSave = async (section: string) => {
    setSaving(section);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(null);
    toast.success(`${section} settings saved`);
  };

  const toggleFlag = (key: string, currentEnabled: boolean) => {
    toggleFlagMut.mutate({ key, enabled: !currentEnabled });
  };

  return (
    <AdminLayout title="Settings" breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Settings" }]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">System Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure global platform settings, security, and integrations</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="bg-slate-800/60 border border-slate-700/50 flex-wrap h-auto gap-1 p-1">
            {[
              { value: "general", label: "General", icon: Settings },
              { value: "security", label: "Security", icon: Shield },
              { value: "payments", label: "Payments", icon: CreditCard },
              { value: "email", label: "Email", icon: Mail },
              { value: "ai", label: "AI Settings", icon: Cpu },
              { value: "flags", label: "Feature Flags", icon: Flag },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 text-xs flex items-center gap-1.5">
                <Icon className="w-3 h-3" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-6">
              <SettingSection title="Platform Details">
                <FieldRow label="Platform Name" description="Public-facing name of the platform">
                  <Input defaultValue={(settings.platform_name as string) ?? "EverythingNeed"} className="w-48 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
                <FieldRow label="Support Email" description="Email shown to users for support">
                  <Input defaultValue={(settings.support_email as string) ?? "support@everythingneed.com"} className="w-56 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
                <FieldRow label="Default Currency" description="Currency for all transactions">
                  <select className="h-8 px-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    <option>USD</option><option>EUR</option><option>GBP</option><option>NGN</option>
                  </select>
                </FieldRow>
                <FieldRow label="Maintenance Mode" description="Show maintenance page to all users">
                  <Switch aria-label="Toggle maintenance mode" />
                </FieldRow>
              </SettingSection>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => handleSave("General")} disabled={saving === "General"} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  {saving === "General" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-6">
              <SettingSection title="Authentication">
                <FieldRow label="Force 2FA for Admins" description="Require two-factor authentication for all admin accounts">
                  <Switch defaultChecked aria-label="Force 2FA" />
                </FieldRow>
                <FieldRow label="Session Timeout (minutes)" description="Auto-logout after inactivity">
                  <Input defaultValue={(settings.session_timeout as string) ?? "60"} type="number" className="w-24 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
                <FieldRow label="Max Login Attempts" description="Lock account after N failed attempts">
                  <Input defaultValue={(settings.max_login_attempts as string) ?? "5"} type="number" className="w-24 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
                <FieldRow label="IP Allowlist (Admin)" description="Restrict admin panel to specific IPs (comma-separated)">
                  <Input placeholder="Any IP" className="w-56 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
              </SettingSection>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => handleSave("Security")} disabled={saving === "Security"} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  {saving === "Security" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-6">
              <SettingSection title="Payment Gateways">
                <FieldRow label="Stripe" description="Enable Stripe for card payments">
                  <Switch defaultChecked aria-label="Enable Stripe" />
                </FieldRow>
                <FieldRow label="Stripe Secret Key">
                  <Input type="password" defaultValue="sk_live_xxxxxxxxxxxxx" className="w-56 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
                <Separator className="bg-slate-700/40" />
                <FieldRow label="Paystack" description="Enable Paystack for NGN payments">
                  <Switch aria-label="Enable Paystack" />
                </FieldRow>
                <FieldRow label="Platform Commission (%)" description="Fee taken on every successful order">
                  <Input defaultValue={(settings.commission_rate as string) ?? "10"} type="number" className="w-24 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" />
                </FieldRow>
              </SettingSection>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => handleSave("Payments")} disabled={saving === "Payments"} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  {saving === "Payments" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Email */}
          <TabsContent value="email">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-6">
              <SettingSection title="SMTP Configuration">
                <FieldRow label="SMTP Host"><Input defaultValue={(settings.smtp_host as string) ?? "smtp.mailgun.org"} className="w-48 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
                <FieldRow label="SMTP Port"><Input defaultValue={(settings.smtp_port as string) ?? "587"} type="number" className="w-24 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
                <FieldRow label="SMTP Username"><Input defaultValue={(settings.smtp_username as string) ?? "noreply@everythingneed.com"} className="w-56 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
                <FieldRow label="SMTP Password"><Input type="password" defaultValue="secretpassword" className="w-40 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
                <FieldRow label="From Name"><Input defaultValue={(settings.from_name as string) ?? "EverythingNeed"} className="w-48 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
              </SettingSection>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.success("Test email sent!")} className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
                  Send Test Email
                </Button>
                <Button size="sm" onClick={() => handleSave("Email")} disabled={saving === "Email"} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  {saving === "Email" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6 space-y-6">
              <SettingSection title="AI Configuration">
                <FieldRow label="AI Provider"><select className="h-8 px-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-300"><option>OpenAI</option><option>Google Gemini</option><option>Anthropic</option></select></FieldRow>
                <FieldRow label="API Key"><Input type="password" placeholder="sk-..." className="w-56 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
                <FieldRow label="AI Recommendations" description="Enable AI product recommendations"><Switch defaultChecked={false} aria-label="AI Recommendations" /></FieldRow>
                <FieldRow label="AI Support Bot" description="Enable AI-powered support chatbot"><Switch aria-label="AI Support Bot" /></FieldRow>
                <FieldRow label="Max Tokens per Request"><Input defaultValue={(settings.max_tokens as string) ?? "2048"} type="number" className="w-24 h-8 text-xs bg-slate-800 border-slate-700 text-slate-200" /></FieldRow>
              </SettingSection>
              <div className="flex justify-end">
                <Button size="sm" onClick={() => handleSave("AI")} disabled={saving === "AI"} className="bg-violet-600 hover:bg-violet-700 text-white text-xs">
                  {saving === "AI" ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Feature Flags */}
          <TabsContent value="flags">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-200">Feature Flags</h3>
                <p className="text-xs text-slate-500 mt-1">Toggle platform features without code deployments</p>
              </div>
              <div className="space-y-1">
                {flags.map((flag) => (
                  <div key={flag.key} className="flex items-center justify-between py-3 border-b border-slate-700/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{flag.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{flag.description}</p>
                      <code className="text-[10px] text-slate-600 font-mono">{flag.key}</code>
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => toggleFlag(flag.key, flag.enabled)}
                      aria-label={`Toggle ${flag.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
