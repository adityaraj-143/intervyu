"use client";

import { BACKEND_URL } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner"

export default function Home() {

  const [githubUsername, setGithubUsername] = useState<String | null>();
  const router = useRouter()

  const handleClick = async () => {
    if(!githubUsername) {
      toast.error("Please enter a GitHub username");
      return;
    }

    const resp = await axios.post(`${BACKEND_URL}/api/v1/interview`, { githubUsername })
    if (resp.status == 200) {
      router.push('/interview/1');
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      
      <input placeholder="GitHub username" onChange={(e) => setGithubUsername(e.target.value)}></input>      
      <button onClick={handleClick}>Start</button>
    </div>
  );
}
