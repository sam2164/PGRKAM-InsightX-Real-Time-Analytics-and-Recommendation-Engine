import React from "react";

export default function Insights() {
  const insights = [
    {
      title: "Female workforce participation",
      text: "Targeted skilling + childcare support in Ludhiana and Amritsar could boost participation by 7–11% within 12 months.",
      tags: ["Impact", "Feasibility", "Equity"]
    },
    {
      title: "Skill vouchers ROI",
      text: "₹1 invested in foundational digital skills returns ~₹3.4 in 18 months via higher placement rates.",
      tags: ["Impact", "Feasibility", "Equity"]
    },
    {
      title: "Seasonal migration",
      text: "Bathinda & Moga show outbound spikes pre-harvest; temporary placement drives can reduce drop-offs by 12%.",
      tags: ["Impact", "Feasibility", "Equity"]
    },
    {
      title: "Language UX",
      text: "Punjabi-first job descriptions increase application completion by 9% for first-time users.",
      tags: ["Impact", "Feasibility", "Equity"]
    }
  ];

  return (
    <div className="w-full min-h-screen px-12 py-10 bg-[#0D1117]">
      <h1 className="text-3xl font-semibold text-white mb-8 tracking-tight">
        Policy Insights
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl p-6 bg-[#161B22] border border-[#222] shadow-lg
                       hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
          >
            <h2 className="text-xl font-semibold text-white mb-3">
              {item.title}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              {item.text}
            </p>

            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag, tIndex) => (
                <span
                  key={tIndex}
                  className="text-xs px-3 py-1 rounded-full bg-[#1F6FEB]/20 
                             text-[#58A6FF] border border-[#1F6FEB]/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}