import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/ui/page-shell";
import { Card, CardContent } from "../components/ui/card";

const sections = [
  {
    id: "information-collected",
    title: "1. What Information We Collect",
    paragraphs: [
      "We collect personal information you provide directly when you create an account, complete your athlete profile, use the coaching chat, contact us, or connect third-party services.",
      "This may include your name, email address, password, athlete profile details such as goal race, race distance, experience level, weakest discipline, training availability, injury or limiter notes, and messages you send through TriGuide.",
      "Injury, recovery, and physical limiter information may be treated as sensitive or special-category personal data in some jurisdictions. We collect it only to personalize coaching guidance when you choose to provide it.",
      "If you choose to connect Strava, we may collect authorized profile and activity information from your Strava account, including workout history and related training metrics.",
    ],
  },
  {
    id: "how-we-use",
    title: "2. How We Process Your Information",
    paragraphs: [
      "We use personal information to create and manage accounts, authenticate users, deliver coaching responses, personalize recommendations, sync and display Strava data, maintain service security, and improve the app.",
      "TriGuide also uses third-party AI services to generate coaching insights. Inputs, conversation history, and relevant profile context may be processed by our AI provider to deliver responses.",
    ],
  },
  {
    id: "sharing",
    title: "3. When and With Whom We Share Information",
    paragraphs: [
      "We may share information with service providers that help us operate TriGuide, such as hosting, infrastructure, AI, and connected fitness providers.",
      "This currently includes providers such as Vercel, Railway, Anthropic, and Strava, to the extent needed to deliver the Services.",
      "We do not sell personal information and do not share it for targeted advertising. We share information with service providers only as necessary to operate TriGuide and deliver the coaching service.",
    ],
  },
  {
    id: "ai",
    title: "4. AI-Based Features",
    paragraphs: [
      "TriGuide offers AI-powered coaching and insights. To provide these features, relevant user inputs, account context, profile information, and related training context may be processed by our AI service provider, Anthropic.",
      "These AI features are intended to support endurance training guidance and should not be treated as medical advice.",
    ],
  },
  {
    id: "retention",
    title: "5. How Long We Keep Information",
    paragraphs: [
      "We keep personal information for as long as reasonably necessary to provide TriGuide, maintain accounts, comply with legal obligations, resolve disputes, and enforce our terms.",
      "In general, account-related information is retained while a user account remains active unless earlier deletion is requested and legally permitted.",
    ],
  },
  {
    id: "security",
    title: "6. How We Keep Information Safe",
    paragraphs: [
      "We use reasonable technical and organizational measures designed to protect personal information. However, no internet transmission or storage system can be guaranteed to be completely secure.",
      "If we become aware of a data breach involving personal information, we will investigate promptly and notify affected users and regulators when required by applicable law, including applicable breach-notification timelines.",
    ],
  },
  {
    id: "minors",
    title: "7. Information From Minors",
    paragraphs: [
      "TriGuide is not intended for children under 18 years of age, and we do not knowingly collect personal information from minors.",
    ],
  },
  {
    id: "rights",
    title: "8. Your Privacy Rights",
    paragraphs: [
      "Depending on your location, you may have rights to access, correct, delete, or obtain a copy of personal information we hold about you, and to withdraw consent where applicable.",
      "You can exercise applicable rights by contacting us using the email below or through the Termly data request form.",
    ],
  },
  {
    id: "us-rights",
    title: "9. United States Privacy Rights",
    paragraphs: [
      "Residents of certain US states may have additional privacy rights under applicable law, including rights to know, access, correct, delete, and appeal certain privacy decisions.",
    ],
  },
  {
    id: "updates",
    title: "10. Updates to This Notice",
    paragraphs: [
      "We may update this Privacy Policy from time to time. The updated version will be indicated by a revised date on this page.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="pill mb-4">Legal</div>
                <h2 className="font-['Barlow_Condensed'] text-5xl font-bold uppercase leading-none text-[var(--accent)]">
                  Privacy Policy
                </h2>
                <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
                  Last updated April 16, 2026. This page summarizes the privacy terms for TriGuide based on your Termly
                  policy configuration.
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--primary)]">
                <ShieldCheck className="h-8 w-8" />
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
              <a
                href="https://app.termly.io/dsar/9ca1c0b9-8ff3-4d1c-88b7-ffc8271e92ad"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-[4px] bg-[var(--primary)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--primary-dark)]"
              >
                Submit Data Request
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6 md:p-8">
            <div>
              <p className="kicker">Controller</p>
              <p className="mt-2 text-lg font-semibold">Jonah Femiani</p>
              <p className="mt-2 text-[var(--text-muted)]">
                Questions or privacy requests can be sent to{" "}
                <a className="text-[var(--primary)] hover:underline" href="mailto:jonah.femiani07@gmail.com">
                  jonah.femiani07@gmail.com
                </a>
                .
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                This public version intentionally omits a street mailing address. If you want that published, I can add it.
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

        <Card id="contact">
          <CardContent className="p-6 md:p-8">
            <h3 className="font-['Barlow_Condensed'] text-4xl font-bold uppercase leading-none text-[var(--accent)]">
              Contact and Data Requests
            </h3>
            <div className="mt-4 space-y-4 text-[var(--text-muted)]">
              <p className="leading-7">
                If you have questions about this Privacy Policy or want to review, update, or delete the personal data
                we collect, email{" "}
                <a className="text-[var(--primary)] hover:underline" href="mailto:jonah.femiani07@gmail.com">
                  jonah.femiani07@gmail.com
                </a>{" "}
                or use the Termly request form below.
              </p>
              <p>
                <a
                  className="inline-flex items-center text-[var(--primary)] hover:underline"
                  href="https://app.termly.io/dsar/9ca1c0b9-8ff3-4d1c-88b7-ffc8271e92ad"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open the Termly data subject access request form
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
