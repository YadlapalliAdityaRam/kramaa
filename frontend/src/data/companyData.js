export const companies = [
    {
        name: "TATA CONSULTANCY SERVICES (TCS)",
        type: "Service-Based",
        history: {
            founded: 1968,
            headquarters: "Mumbai, India",
            revenue: "$27+ billion (2023)",
            employees: "600,000+"
        },
        skills: ["C", "C++", "Java", "SQL", "Aptitude", "Basic DSA"],
        package: {
            ninja: "₹3.5 LPA",
            digital: "₹7 LPA",
            prime: "₹9+ LPA"
        },
        process: [
            "TCS NQT (Aptitude + Reasoning)",
            "Coding Round (2 questions)",
            "Technical Interview",
            "HR Interview"
        ],
        focusAreas: [
            { name: "Arrays", topic: "arrays" },
            { name: "Strings", topic: "strings" },
            { name: "SQL", topic: "sql" }
        ]
    },
    {
        name: "INFOSYS",
        type: "Service-Based",
        history: {
            founded: 1981,
            headquarters: "Bangalore, India",
            revenue: "$18+ billion (2023)"
        },
        skills: ["Java/Python/C++", "DSA (Moderate)", "SQL", "OOPs"],
        package: {
            se: "₹3.5-4 LPA",
            dse: "₹6-6.5 LPA",
            sp: "₹9.5 LPA"
        },
        process: [
            "Online Test (Aptitude + Coding)",
            "Technical Interview",
            "HR Interview"
        ],
        focusAreas: [
            { name: "Sorting", topic: "sorting" },
            { name: "Recurison", topic: "recursion" }
        ]
    },
    {
        name: "GOOGLE",
        type: "Product-Based",
        history: {
            founded: 1998,
            headquarters: "Mountain View, CA",
            revenue: "$300+ billion"
        },
        skills: ["Advanced DSA (Hard)", "System Design", "OS", "Networks", "CP"],
        package: {
            l3: "₹30-40 LPA",
            l4: "₹40-60 LPA"
        },
        process: [
            "Resume Screening",
            "Phone Screen (1-2 rounds)",
            "Onsite (4-5 rounds)",
            "Team Matching"
        ],
        focusAreas: [
            { name: "Dynamic Programming", topic: "dp" },
            { name: "Graphs", topic: "graphs" },
            { name: "Trees", topic: "trees" }
        ]
    },
    {
        name: "AMAZON",
        type: "Product-Based",
        history: {
            founded: 1994,
            headquarters: "Seattle, WA"
        },
        skills: ["DSA (Medium-Hard)", "Leadership Principles", "OOPS", "System Design"],
        package: {
            sde1: "₹38-44 LPA",
            sde2: "₹45-65 LPA"
        },
        process: [
            "Online Assessment",
            "Phone Screen",
            "Onsite Loop (4 rounds)",
            "Bar Raiser Round"
        ],
        focusAreas: [
            { name: "Sliding Window", topic: "sliding-window" },
            { name: "BFS/DFS", topic: "graphs" },
            { name: "Hash Maps", topic: "hashing" }
        ]
    }
];

export const guide = `
## General Preparation Timeline

**For Service-Based Companies:**
- **3-4 months before placements**:
  - Basic DSA (200 easy-medium problems)
  - Aptitude preparation (1 month)
  - Resume building
  - 2-3 projects

**For Product-Based Companies:**
- **6-12 months before applying**:
  - Strong DSA (400-500 problems)
  - System design (2-3 months)
  - Competitive programming
  - Strong projects/internships
`;
