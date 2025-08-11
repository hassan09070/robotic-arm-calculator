interface Link {
  length: number;
  radius: number;
}

interface Motor {
  mass: number;
  bodyLength: number;
  pivotPosition: number;
  rpm: number;
  gearRatio: number;
  safetyFactor: number;
}

interface InputData {
  m_payload: number;
  density: number;
  links: Link[];
  motors: Motor[];
}

interface MotorResult {
  T_total: number;
  T_sf: number;
  T_before: number;
  T_before_sf: number;
  P: number;
  P_sf: number;
}

export function performCalculations(data: InputData): MotorResult[] | { error: string } {
  try {
    const g = 9.80665;
    const pi = 3.141592653589793;

    // Extract inputs
    const { m_payload, density, links, motors } = data;

    // Input validation
    if (m_payload < 0) throw new Error("Payload mass cannot be negative");
    if (density < 0) throw new Error("Density must be positive");
    if (links.length !== 6) throw new Error("Exactly 6 links are required");
    if (motors.length !== 6) throw new Error("Exactly 6 motors are required");

    const L = links.map((link) => link.length);
    const r = links.map((link) => link.radius);
    const m_motor = motors.map((motor) => motor.mass);
    const a = motors.map((motor) => motor.bodyLength);
    const M = motors.map((motor) => motor.pivotPosition);
    const rpm = motors.map((motor) => motor.rpm);
    const R = motors.map((motor) => motor.gearRatio);
    const SF = motors.map((motor) => motor.safetyFactor);

    // Validate arrays
    for (let i = 0; i < 6; i++) {
      if (L[i] <= 0) throw new Error(`Link ${i + 1} length must be positive`);
      if (r[i] <= 0) throw new Error(`Link ${i + 1} radius must be positive`);
      if (m_motor[i] < 0) throw new Error(`Motor ${i + 1} mass cannot be negative`);
      if (a[i] < 0) throw new Error(`Motor ${i + 1} body length cannot be negative`);
      if (M[i] < 0) throw new Error(`Motor ${i + 1} pivot position cannot be negative`);
      if (rpm[i] < 0) throw new Error(`Motor ${i + 1} RPM cannot be negative`);
      if (R[i] < 0) throw new Error(`Motor ${i + 1} gear ratio cannot be negative`);
      if (SF[i] < 1) throw new Error(`Motor ${i + 1} safety factor must be at least 1`);
    }

    // Joint positions
    const S: number[] = [];
    S[0] = L[0];
    for (let i = 1; i < 6; i++) {
      S[i] = S[i - 1] + L[i];
    }

    // Weights
    const W_L = L.map((len: number, i: number) => g * density * pi * r[i] ** 2 * len);
    const W_M = m_motor.map((m: number) => g * m);
    const W_P = g * m_payload;

    // Calculate torques and powers for each motor
    const motorResults: MotorResult[] = [];

    // Motor 6
    const T6_payload = W_P * (S[5] - M[5]);
    const T6_L6 = W_L[5] * (S[5] - M[5] - L[5] / 2);
    const T6_total = T6_payload + T6_L6;
    const T6_sf = SF[5] * T6_total;
    const T6_before = R[5] !== 0 ? T6_total / R[5] : 0;
    const T6_before_sf = SF[5] * T6_before;
    const P6 = rpm[5] !== 0 ? (T6_before * rpm[5] * 1000 / 9550) : 0;
    const P6_sf = SF[5] * P6;
    motorResults.push({ T_total: T6_total, T_sf: T6_sf, T_before: T6_before, T_before_sf: T6_before_sf, P: P6, P_sf: P6_sf });

    // Motor 5
    const T5_payload = W_P * (S[5] - M[4]);
    const T5_L6 = W_L[5] * (S[5] - M[4] - L[5] / 2);
    const T5_M6 = W_M[5] * ((M[5] + a[5] / 2) - M[4]);
    const T5_L5 = W_L[4] * (S[4] - M[4] - L[4] / 2);
    const T5_total = T5_payload + T5_L6 + T5_M6 + T5_L5;
    const T5_sf = SF[4] * T5_total;
    const T5_before = R[4] !== 0 ? T5_total / R[4] : 0;
    const T5_before_sf = SF[4] * T5_before;
    const P5 = rpm[4] !== 0 ? (T5_before * rpm[4] * 1000 / 9550) : 0;
    const P5_sf = SF[4] * P5;
    motorResults.push({ T_total: T5_total, T_sf: T5_sf, T_before: T5_before, T_before_sf: T5_before_sf, P: P5, P_sf: P5_sf });

    // Motor 4
    const T4_payload = W_P * (S[5] - M[3]);
    const T4_L6 = W_L[5] * (S[5] - M[3] - L[5] / 2);
    const T4_L5 = W_L[4] * (S[4] - M[3] - L[4] / 2);
    const T4_M6 = W_M[5] * ((M[5] + a[5] / 2) - M[3]);
    const T4_M5 = W_M[4] * ((M[4] + a[4] / 2) - M[3]);
    const T4_L4 = W_L[3] * (S[3] - M[3] - L[3] / 2);
    const T4_total = T4_payload + T4_L6 + T4_L5 + T4_M6 + T4_M5 + T4_L4;
    const T4_sf = SF[3] * T4_total;
    const T4_before = R[3] !== 0 ? T4_total / R[3] : 0;
    const T4_before_sf = SF[3] * T4_before;
    const P4 = rpm[3] !== 0 ? (T4_before * rpm[3] * 1000 / 9550) : 0;
    const P4_sf = SF[3] * P4;
    motorResults.push({ T_total: T4_total, T_sf: T4_sf, T_before: T4_before, T_before_sf: T4_before_sf, P: P4, P_sf: P4_sf });

    // Motor 3
    const T3_payload = W_P * (S[5] - M[2]);
    const T3_L6 = W_L[5] * (S[5] - M[2] - L[5] / 2);
    const T3_L5 = W_L[4] * (S[4] - M[2] - L[4] / 2);
    const T3_L4 = W_L[3] * (S[3] - M[2] - L[3] / 2);
    const T3_M6 = W_M[5] * ((M[5] + a[5] / 2) - M[2]);
    const T3_M5 = W_M[4] * ((M[4] + a[4] / 2) - M[2]);
    const T3_M4 = W_M[3] * ((M[3] + a[3] / 2) - M[2]);
    const T3_L3 = W_L[2] * (S[2] - M[2] - L[2] / 2);
    const T3_total = T3_payload + T3_L6 + T3_L5 + T3_L4 + T3_M6 + T3_M5 + T3_M4 + T3_L3;
    const T3_sf = SF[2] * T3_total;
    const T3_before = R[2] !== 0 ? T3_total / R[2] : 0;
    const T3_before_sf = SF[2] * T3_before;
    const P3 = rpm[2] !== 0 ? (T3_before * rpm[2] * 1000 / 9550) : 0;
    const P3_sf = SF[2] * P3;
    motorResults.push({ T_total: T3_total, T_sf: T3_sf, T_before: T3_before, T_before_sf: T3_before_sf, P: P3, P_sf: P3_sf });

    // Motor 2
    const T2_payload = W_P * (S[5] - M[1]);
    const T2_L6 = W_L[5] * (S[5] - M[1] - L[5] / 2);
    const T2_L5 = W_L[4] * (S[4] - M[1] - L[4] / 2);
    const T2_L4 = W_L[3] * (S[3] - M[1] - L[3] / 2);
    const T2_L3 = W_L[2] * (S[2] - M[1] - L[2] / 2);
    const T2_L2 = W_L[1] * (S[1] - M[1] - L[1] / 2);
    const T2_M6 = W_M[5] * ((M[5] + a[5] / 2) - M[1]);
    const T2_M5 = W_M[4] * ((M[4] + a[4] / 2) - M[1]);
    const T2_M4 = W_M[3] * ((M[3] + a[3] / 2) - M[1]);
    const T2_M3 = W_M[2] * ((M[2] + a[2] / 2) - M[1]);
    const T2_total = T2_payload + T2_L6 + T2_L5 + T2_L4 + T2_L3 + T2_L2 + T2_M6 + T2_M5 + T2_M4 + T2_M3;
    const T2_sf = SF[1] * T2_total;
    const T2_before = R[1] !== 0 ? T2_total / R[1] : 0;
    const T2_before_sf = SF[1] * T2_before;
    const P2 = rpm[1] !== 0 ? (T2_before * rpm[1] * 1000 / 9550) : 0;
    const P2_sf = SF[1] * P2;
    motorResults.push({ T_total: T2_total, T_sf: T2_sf, T_before: T2_before, T_before_sf: T2_before_sf, P: P2, P_sf: P2_sf });

    // Motor 1
    const T1_payload = W_P * (S[5] - M[0]);
    const T1_L6 = W_L[5] * (S[5] - M[0] - L[5] / 2);
    const T1_L5 = W_L[4] * (S[4] - M[0] - L[4] / 2);
    const T1_L4 = W_L[3] * (S[3] - M[0] - L[3] / 2);
    const T1_L3 = W_L[2] * (S[2] - M[0] - L[2] / 2);
    const T1_L2 = W_L[1] * (S[1] - M[0] - L[1] / 2);
    const T1_L1 = W_L[0] * (S[0] - M[0] - L[0] / 2);
    const T1_M6 = W_M[5] * ((M[5] + a[5] / 2) - M[0]);
    const T1_M5 = W_M[4] * ((M[4] + a[4] / 2) - M[0]);
    const T1_M4 = W_M[3] * ((M[3] + a[3] / 2) - M[0]);
    const T1_M3 = W_M[2] * ((M[2] + a[2] / 2) - M[0]);
    const T1_M2 = W_M[1] * ((M[1] + a[1] / 2) - M[0]);
    const T1_total = T1_payload + T1_L6 + T1_L5 + T1_L4 + T1_L3 + T1_L2 + T1_L1 + T1_M6 + T1_M5 + T1_M4 + T1_M3 + T1_M2;
    const T1_sf = SF[0] * T1_total;
    const T1_before = R[0] !== 0 ? T1_total / R[0] : 0;
    const T1_before_sf = SF[0] * T1_before;
    const P1 = rpm[0] !== 0 ? (T1_before * rpm[0] * 1000 / 9550) : 0;
    const P1_sf = SF[0] * P1;
    motorResults.push({ T_total: T1_total, T_sf: T1_sf, T_before: T1_before, T_before_sf: T1_before_sf, P: P1, P_sf: P1_sf });

    return motorResults;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || "An error occurred during calculations" };
  }
}