export default function Subscriptions() {
  return (
    <div className="py-12">
      <h1 className="text-center text-2xl mb-12">subscriptions</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Free Plan */}
        <div className="bg-[#1E1E1E] rounded-lg p-6">
          <h2 className="text-lg font-semibold">Free Plan</h2>
          <p className="text-gray-400 text-sm">(Alpha-only, invite-only)</p>
          <p className="text-base mt-1 mb-6">£0 per month</p>

          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>Retires at end of alpha</li>
            <li>20 generations / month</li>
            <li>Prompt-enhancer access</li>
            <li>Core community models</li>
            <li>Personal, non-commercial use only</li>
            <li>Community-forum support</li>
          </ul>
        </div>

        {/* Individual Plan */}
        <div className="bg-[#1E1E1E] rounded-lg p-6">
          <h2 className="text-lg font-semibold">Individual Plan</h2>
          <p className="text-base mt-1">£15 per month</p>
          <p className="text-red-500 text-sm mb-6">(or £144 per year – save ~20%)</p>

          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>200 generations / month</li>
            <li>Choose from full core model library</li>
            <li>Prompt-enhancer access</li>
            <li>Core community models</li>
            <li>Personal, non-commercial use only</li>
            <li>Community-forum support</li>
            <li>Next-day e-mail support</li>
          </ul>
        </div>

        {/* Professional Plan */}
        <div className="bg-[#1E1E1E] rounded-lg p-6">
          <h2 className="text-lg font-semibold">Professional Plan</h2>
          <p className="text-base mt-1">£50 per month</p>
          <p className="text-red-500 text-sm mb-6">(or £480 per year – save ~20%)</p>

          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>2,000 generations / month</li>
            <li>Prompt-enhancer access</li>
            <li>Core community models</li>
            <li>Community-forum support</li>
            <li>Rights-cleared, brand-safe outputs</li>
            <li>Extended model library & LoRAs</li>
            <li>Same-day ticket support</li>
            <li>Priority queue & batch jobs</li>
          </ul>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-[#1E1E1E] rounded-lg p-6">
          <h2 className="text-lg font-semibold">Enterprise Plan</h2>
          <p className="text-base mt-1">from £1,000 per month</p>
          <p className="text-red-500 text-sm mb-6">(or £10,200 per year – save ~15%)</p>

          <ul className="space-y-2 list-disc pl-5 text-sm">
            <li>Unlimited fair-use generations</li>
            <li>Prompt-enhancer access</li>
            <li>Core community models</li>
            <li>Community-forum support</li>
            <li>Rights-cleared, brand-safe outputs</li>
            <li>Extended model library & LoRAs</li>
            <li>Same-day ticket support</li>
            <li>Priority queue & batch jobs</li>
            <li>Custom-trained, private models</li>
            <li>Copyright & trademark indemnity</li>
            <li>Single Sign-On, API, audit logs</li>
            <li>Dedicated success manager</li>
          </ul>
        </div>
      </div>

      <div className="mt-16">
        <h3 className="text-lg mb-4">what's included in every plan</h3>
        <ul className="space-y-2 list-disc pl-5 text-sm">
          <li>
            prompt enhancer – automatically expands your idea into a detailed, camera-ready brief
          </li>
          <li>
            live model orchestration – our AI picks the best AI tools/engines for every task in real
            time
          </li>
          <li>secure cloud storage – access all your past generations in one place</li>
        </ul>
      </div>

      <div className="mt-16">
        <h3 className="text-lg mb-4">launching timeline</h3>
        <ul className="space-y-2 list-disc pl-5 text-sm">
          <li>prototype (current) – for investor</li>
          <li>alpha end Q2 – limited Free tier only, for private testing</li>
          <li>public beta Q3 2025 – Free & Individual tiers go live</li>
          <li>
            pro / enterprise early-access Q4 2025 – invite-only pilots with rights-cleared outputs
          </li>
        </ul>
      </div>
    </div>
  );
}
