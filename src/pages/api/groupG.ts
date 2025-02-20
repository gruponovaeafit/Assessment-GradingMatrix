import type { NextApiRequest, NextApiResponse } from "next";
const mockDatabase = {
    users: [
        "Alice Blandon Redondo", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack",
        "Kathy", "Leo", "Mona", "Nate", "Olivia", "Paul", "Quincy", "Rachel Gutierrez Martinez", "Steve", "Tracy"
    ]
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).json({ message: "Method not allowed" });
        return;
    }

    const { groups } = req.body;
 

    const users = mockDatabase.users;

    let groupsGenerated: string[][] = [];

    for (let i = 0; i < groups; i++) {
        groupsGenerated.push([]);
    }

    users.forEach((user, index) => {
        groupsGenerated[index % groups].push(user);
    });


    if (!groups) {
        res.status(400).json({ message: "Missing groups" });
        return;
    }

    res.status(200).json({ message: "Groups generated", groups: groupsGenerated });
    
};   