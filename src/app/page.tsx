"use client";

import { useState } from "react";
import CalculatorForm from "@/components/CalculatorForm";
import ResultsTable from "@/components/ResultsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performCalculations } from "@/lib/calculations";

// Define types matching calculations.ts
interface MotorResult {
  T_total: number;
  T_sf: number;
  T_before: number;
  T_before_sf: number;
  P: number;
  P_sf: number;
}

interface InputData {
  m_payload: number;
  density: number;
  links: { length: number; radius: number }[];
  motors: {
    mass: number;
    bodyLength: number;
    pivotPosition: number;
    rpm: number;
    gearRatio: number;
    safetyFactor: number;
  }[];
}

// State can be null, MotorResult[], or error object
type ResultsState = null | MotorResult[] | { error: string };

export default function Home() {
  const [results, setResults] = useState<ResultsState>(null);

  const handleCalculate = (data: InputData) => {
    const calculatedResults = performCalculations(data);
    setResults(calculatedResults);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>6DOF Robotic Arm Torque & Power Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <CalculatorForm onCalculate={handleCalculate} results={results} />
          {results && "error" in results ? (
            <div className="text-red-500 mt-4">{results.error}</div>
          ) : (
            results && <ResultsTable results={results as MotorResult[]} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}