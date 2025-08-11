import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsTableProps {
  results: Array<{
    T_total: number;
    T_sf: number;
    T_before: number;
    T_before_sf: number;
    P: number;
    P_sf: number;
  }>;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">Results</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Motor</TableHead>
            <TableHead>Torque Total (Nm)</TableHead>
            <TableHead>Torque SF (Nm)</TableHead>
            <TableHead>Torque Before (Nm)</TableHead>
            <TableHead>Torque Before SF (Nm)</TableHead>
            <TableHead>Power (W)</TableHead>
            <TableHead>Power SF (W)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{result.T_total.toFixed(2)}</TableCell>
              <TableCell>{result.T_sf.toFixed(2)}</TableCell>
              <TableCell>{result.T_before.toFixed(2)}</TableCell>
              <TableCell>{result.T_before_sf.toFixed(2)}</TableCell>
              <TableCell>{result.P.toFixed(2)}</TableCell>
              <TableCell>{result.P_sf.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}