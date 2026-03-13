"use client";

import { useEffect, useState } from "react";

interface Farm {
  id: string;
  name: string;
  farmSlot: number;
  serverName: string;
  gameServerId: string;
}

export function useSendTransaction() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/farms/mine")
      .then((res) => (res.ok ? res.json() : []))
      .then(setFarms)
      .finally(() => setLoading(false));
  }, []);

  return { farms, loading };
}
