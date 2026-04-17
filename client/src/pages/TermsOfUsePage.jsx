import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of These Terms",
    paragraphs: [
      "These Terms of Use govern your access to and use of TriGuide. By creating an account, accessing the site, or using the Services, you agree to be bound by these Terms.",
      "If you do not agree to these Terms, do not use TriGuide.",
    ],
  },
  {
    id: "service",
    title: "2. Description of the Service",
    paragraphs: [
      "TriGuide is a triathlon coaching and training guidance application that provides athlete profile management, AI-generated coaching responses, optional Strava-connected activity display, and user-saved coaching notes.",
      "We may modify, suspend, or discontinue all or part of the Services at any time.",
    ],
  },
  {
    id: "accounts",
    title: "3. Accounts and Eligibility",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
      "You must provide accurate information and keep it up to date. TriGuide is not intended for users under 18 years of age.",
    ],
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable Use",
    paragraphs: [
      "You agree not to misuse the Services, interfere with the app, attempt unauthorized access, reverse engineer protected portions of the product, or use TriGuide in violation of applicable law.",
      "You also agree not to submit harmful, abusive, infringing, or fraudulent content through the app.",
    ],
  },
  {
    id: "ai-disclaimer",
    title: "5. AI Coaching Disclaimer",
    paragraphs: [
      "TriGuide provides AI-assisted coaching and training guidance for informational purposes only. It is not medical advice, diagnosis, treatment, or emergency guidance.",
      "You are responsible for evaluating whether any training recommendation is appropriate for your health, fitness level, injuries, and circumstances. Consult a physician or other qualified professional before beginning or changing a training program, especially if you have injuries, pain, or other health concerns.",
    ],
  },
  {
    id: "strava",
    title: "6. Strava and Third-Party Services",
    paragraphs: [
      "If you connect Strava or use other third-party integrations, you authorize TriGuide to access and process the data you permit through those services.",
      "Strava data shown inside TriGuide is used as a connected reference feature. AI coaching uses only the information you explicitly provide to TriGuide, including any coaching notes you choose to save.",
      "Your use of third-party services is also governed by their own terms and privacy policies, and we are not responsible for those third-party services.",
    ],
  },
  {
    id: "ip",
    title: "7. Intellectual Property",
    paragraphs: [
      "TriGuide, including its branding, software, design, and content, is owned by or licensed to us and is protected by applicable intellectual property laws.",
      "You may use the Services only for personal, non-exclusive, and lawful use in accordance with these Terms.",
    ],
  },
  {
    id: "termination",
    title: "8. Suspension and Termination",
    paragraphs: [
      "We may suspend or terminate your access if you violate these Terms, misuse the Services, create risk for us or other users, or if we otherwise determine that continued access is inappropriate.",
      "You may stop using TriGuide at any time.",
    ],
  },
  {
    id: "warranties",
    title: "9. Disclaimers",
    paragraphs: [
      'TriGuide is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, to the fullest extent permitted by law.',
      "We do not guarantee that the Services will be uninterrupted, error-free, or that any coaching outcomes, race outcomes, or training results will be achieved.",
    ],
  },
  {
    id: "liability",
    title: "10. Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, we will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost data, or training-related consequences arising from your use of TriGuide.",
      "Your use of training recommendations and connected data is at your own risk.",
    ],
  },
  {
    id: "updates",
    title: "11. Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. The updated version will be indicated by a revised date on this page, and continued use of the Services after changes become effective constitutes acceptance of the revised Terms.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact Information",
    paragraphs: [
      "Questions about these Terms can be sent to jonah.femiani07@gmail.com.",
    ],
  },
];

export default function TermsOfUsePage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="pill mb-4">Legal</div>
                <h2 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                  Terms of Use
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
                  Last updated April 17, 2026. These terms govern access to and use of TriGuide.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--accent)]">
                <FileText className="h-8 w-8" />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link
                to="/landing"
                className="inline-flex items-center rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-muted)] transition hover:text-[var(--primary)]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to TriGuide
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6 md:p-8">
            <div>
              <p className="kicker">Owner</p>
              <p className="mt-2 text-lg font-semibold">Jonah Femiani</p>
              <p className="mt-2 text-[var(--text-muted)]">
                Questions about these Terms can be sent to{" "}
                <a className="text-[var(--primary)] hover:underline" href="mailto:jonah.femiani07@gmail.com">
                  jonah.femiani07@gmail.com
                </a>
                .
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {sections.map((section) => (
          <Card key={section.id} id={section.id}>
            <CardContent className="p-6 md:p-8">
              <h3 className="font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
                {section.title}
              </h3>
              <div className="mt-4 space-y-4 text-[var(--text-muted)]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-7">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
