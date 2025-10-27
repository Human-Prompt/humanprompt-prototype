export default function Legal() {
  return (
    <div className="py-12 max-w-4xl mx-auto">
      <h1 className="text-center text-2xl mb-12">LEGAL NOTICE</h1>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-2">Prototype Status</h2>
          <p className="text-gray-300 leading-relaxed">
            This Alpha prototype is provided strictly for private evaluation by authorised testers. Functionality,
            design, pricing, and model mix are experimental and liable to change, break, or disappear at any time. The
            prototype may be withdrawn without notice and no uptime, accuracy, or feature guarantees are offered.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Confidentiality & Intellectual Property</h2>
          <p className="text-gray-300 leading-relaxed">
            Everything you see, hear, or generate—including the interface, workflows, prompt-enhancement guides, and all
            underlying code—is the confidential, copyrighted property of Human Prompt Ltd ("Human Prompt").
          </p>
          <p className="text-gray-300 leading-relaxed mt-2">
            You must not copy, download, screenshot, record, share, reverse-engineer, or otherwise disseminate any part
            of this prototype or its outputs without written permission from a Human Prompt founder.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Third-Party AI Services</h2>
          <p className="text-gray-300 leading-relaxed">
            The system orchestrates multiple external AI models—including, but not limited to, OpenAI (ChatGPT), Flux,
            Kling AI, and Midjourney —each governed by its own terms of service. Human Prompt provides no warranties and
            accepts no liability for the content or conduct of these third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">User Responsibility & Rights Clearance</h2>
          <p className="text-gray-300 leading-relaxed">
            All generations created here remain confidential test assets; you are prohibited from publishing,
            distributing, or commercialising them. In future, our Professional and Enterprise plans will deliver outputs
            that are fully cleared for copyright, trademark, and usage rights, allowing unrestricted exploitation. Until
            then, no licence or clearance is granted for any materials produced in this Alpha.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">No Offer to Invest</h2>
          <p className="text-gray-300 leading-relaxed">
            Nothing in this prototype or companion materials constitutes an offer to sell—or a solicitation of an offer
            to buy—any securities of Human Prompt Ltd.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
          <p className="text-gray-300 leading-relaxed">
            To the fullest extent permitted by law, Human Prompt shall not be liable for any indirect, incidental,
            special, or consequential damages (including loss of profit or data) arising from access to, or use of, this
            prototype.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Governing Law</h2>
          <p className="text-gray-300 leading-relaxed">
            These terms are governed by the laws of England and Wales. All disputes shall be subject to the exclusive
            jurisdiction of the courts of England and Wales.
          </p>
        </section>
      </div>

      <div className="text-right mt-16 text-gray-400">Last updated: 27 April 2025</div>
    </div>
  )
}
