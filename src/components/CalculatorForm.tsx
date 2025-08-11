"use client";

import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import * as XLSX from "xlsx";

// Define schema with Zod
const formSchema = z.object({
  m_payload: z.number().min(0, "Payload mass cannot be negative"),
  density: z.number().min(0, "Density must be positive"),
  links: z
    .array(
      z.object({
        length: z.number().min(0, "Length must be positive"),
        radius: z.number().min(0, "Radius must be positive"),
      })
    )
    .length(6, "Exactly 6 links are required"),
  motors: z
    .array(
      z.object({
        mass: z.number().min(0, "Mass cannot be negative"),
        bodyLength: z.number().min(0, "Body length cannot be negative"),
        pivotPosition: z.number().min(0, "Pivot position cannot be negative"),
        rpm: z.number().min(0, "RPM cannot be negative"),
        gearRatio: z.number().min(0, "Gear ratio cannot be negative"),
        safetyFactor: z.number().min(1, "Safety factor must be at least 1"),
      })
    )
    .length(6, "Exactly 6 motors are required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculatorFormProps {
  onCalculate: (data: FormValues) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results: any; // Will be MotorResult[] | { error: string } | null
}

export default function CalculatorForm({ onCalculate, results }: CalculatorFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      m_payload: 0,
      density: 0,
      links: Array.from({ length: 6 }, () => ({ length: 0, radius: 0 })),
      motors: Array.from({ length: 6 }, () => ({
        mass: 0,
        bodyLength: 0,
        pivotPosition: 0,
        rpm: 0,
        gearRatio: 0,
        safetyFactor: 1,
      })),
    },
  });

  const onSubmit = (data: FormValues) => {
    onCalculate(data);
  };

  const handleFillDummyValues = () => {
    form.reset({
      m_payload: 5, // 5 kg payload
      density: 2700, // Aluminum density in kg/m³
      links: [
        { length: 0.5, radius: 0.02 }, // Link 1
        { length: 0.4, radius: 0.02 }, // Link 2
        { length: 0.3, radius: 0.015 }, // Link 3
        { length: 0.3, radius: 0.015 }, // Link 4
        { length: 0.2, radius: 0.01 }, // Link 5
        { length: 0.1, radius: 0.01 }, // Link 6
      ],
      motors: [
        { mass: 2, bodyLength: 0.1, pivotPosition: 0, rpm: 100, gearRatio: 10, safetyFactor: 1.5 },
        { mass: 1.5, bodyLength: 0.08, pivotPosition: 0.5, rpm: 120, gearRatio: 8, safetyFactor: 1.5 },
        { mass: 1.2, bodyLength: 0.07, pivotPosition: 0.9, rpm: 150, gearRatio: 6, safetyFactor: 1.5 },
        { mass: 1, bodyLength: 0.06, pivotPosition: 1.2, rpm: 180, gearRatio: 5, safetyFactor: 1.5 },
        { mass: 0.8, bodyLength: 0.05, pivotPosition: 1.5, rpm: 200, gearRatio: 4, safetyFactor: 1.5 },
        { mass: 0.5, bodyLength: 0.04, pivotPosition: 1.7, rpm: 250, gearRatio: 3, safetyFactor: 1.5 },
      ],
    });
    onCalculate(form.getValues()); // Trigger calculation with dummy values
  };

  const handleResetValues = () => {
    form.reset({
      m_payload: 0,
      density: 0,
      links: Array.from({ length: 6 }, () => ({ length: 0, radius: 0 })),
      motors: Array.from({ length: 6 }, () => ({
        mass: 0,
        bodyLength: 0,
        pivotPosition: 0,
        rpm: 0,
        gearRatio: 0,
        safetyFactor: 1,
      })),
    });
    onCalculate(form.getValues()); // Clear results by triggering calculation
  };

  const handleExportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Results Sheet
    if (results && !("error" in results)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultData = [
        ["Motor", "Torque Total (Nm)", "Torque SF (Nm)", "Torque Before (Nm)", "Torque Before SF (Nm)", "Power (W)", "Power SF (W)"],
        ...results.map((result: any, i: number) => [
          i + 1,
          result.T_total.toFixed(2),
          result.T_sf.toFixed(2),
          result.T_before.toFixed(2),
          result.T_before_sf.toFixed(2),
          result.P.toFixed(2),
          result.P_sf.toFixed(2),
        ]),
      ];
      const resultSheet = XLSX.utils.aoa_to_sheet(resultData);
      XLSX.utils.book_append_sheet(workbook, resultSheet, "Results");
    } else {
      // If no valid results, export an empty sheet with headers
      const resultData = [
        ["Motor", "Torque Total (Nm)", "Torque SF (Nm)", "Torque Before (Nm)", "Torque Before SF (Nm)", "Power (W)", "Power SF (W)"],
      ];
      const resultSheet = XLSX.utils.aoa_to_sheet(resultData);
      XLSX.utils.book_append_sheet(workbook, resultSheet, "Results");
    }

    // Download Excel file
    XLSX.writeFile(workbook, "robotic_arm_results.xlsx");
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="motors">Motors</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="m_payload"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payload Mass (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="density"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Material Density (kg/m³)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <AccordionItem key={i} value={`link-${i}`}>
                  <AccordionTrigger>Link {i + 1}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`links.${i}.length`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (m)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`links.${i}.radius`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Radius (m)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* Motors Tab */}
          <TabsContent value="motors" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <AccordionItem key={i} value={`motor-${i}`}>
                  <AccordionTrigger>Motor {i + 1}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`motors.${i}.mass`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mass (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`motors.${i}.bodyLength`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Body Length (m)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`motors.${i}.pivotPosition`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pivot Position from Base (m)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`motors.${i}.rpm`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RPM</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`motors.${i}.gearRatio`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gear Reduction Ratio</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`motors.${i}.safetyFactor`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Safety Factor</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>

        <div className="flex space-x-4">
          <Button type="submit">Calculate</Button>
          <Button type="button" variant="secondary" onClick={handleFillDummyValues}>
            Fill Dummy Values
          </Button>
          <Button type="button" variant="destructive" onClick={handleResetValues}>
            Reset Values
          </Button>
          <Button type="button" variant="outline" onClick={handleExportToExcel}>
            Export to Excel
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}