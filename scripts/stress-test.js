/**
 * Stress test za AI Hype Akademija sajt
 * Pokretanje: k6 run scripts/stress-test.js
 * Pre pokretanja postavi BASE_URL env ili izmeni default ispod.
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 20 },   // 30s: do 20 korisnika
    { duration: "1m", target: 50 },    // 1min: do 50
    { duration: "30s", target: 100 },   // 30s: do 100 (stress)
    { duration: "30s", target: 0 },    // 30s: spusti na 0
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% zahteva < 5s
    http_req_failed: ["rate<0.1"],    // manje od 10% grešaka
  },
};

export default function () {
  const urls = [
    `${BASE_URL}/`,
    `${BASE_URL}/join`,
    `${BASE_URL}/affiliate`,
  ];

  for (const url of urls) {
    const res = http.get(url);
    check(res, { "status 200": (r) => r.status === 200 });
    sleep(0.5 + Math.random() * 1);
  }
}
