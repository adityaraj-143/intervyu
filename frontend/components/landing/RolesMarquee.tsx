"use client";

const roles = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full-Stack Developer",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "iOS Developer",
  "Android Developer",
  "Data Scientist",
  "Systems Engineer",
  "Platform Engineer",
  "Security Engineer",
  "Cloud Architect",
  "Site Reliability Engineer",
  "Embedded Systems",
  "Blockchain Developer",
];

export default function RolesMarquee() {
  // Duplicate for seamless loop
  const items = [...roles, ...roles];

  return (
    <div className="w-full overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)" }}>
      <div
        className="flex gap-3 iv-marquee-track"
        style={{ width: "max-content" }}
      >
        {items.map((role, i) => (
          <span
            key={`${role}-${i}`}
            className="inline-flex items-center px-4 py-2 rounded-full whitespace-nowrap"
            style={{
              background: "var(--iv-surface-2)",
              border: "1px solid var(--iv-border-subtle)",
              color: "var(--iv-text-secondary)",
              fontSize: "0.8125rem",
              fontWeight: 450,
              transition: "all 0.25s ease",
            }}
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}
