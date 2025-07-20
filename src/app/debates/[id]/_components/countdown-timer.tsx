"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: Date;
  setDebateOver: (isOver: boolean) => void;
}

export default function CountdownTimer({
  endTime,
  setDebateOver,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      let newTimeLeft = "";

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        newTimeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;
      } else {
        newTimeLeft = "Debate has ended";
        setDebateOver(true);
      }
      return newTimeLeft;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      if (newTime === "Debate has ended") {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, setDebateOver]);

  return <span>{timeLeft}</span>;
}
