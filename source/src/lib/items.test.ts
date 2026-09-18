import { describe, expect, it } from "vitest";
import {
  visibleWhere,
  threadChildWhere,
  isPast,
  parseBangkokEndOfDay,
} from "@/lib/items";

/**
 * ทดสอบฟังก์ชันล้วน ไม่ต้องต่อฐานข้อมูล จึงรันใน CI ได้ทันที
 * เลือกกฎการมองเห็นและวงจรเวลาเป็นชุดแรก เพราะหลายหน้าใช้กฎเดียวกัน
 */

describe("visibleWhere", () => {
  it("ผู้ที่ไม่ได้ล็อกอินเห็นเฉพาะรายการสาธารณะ", () => {
    expect(visibleWhere(false)).toMatchObject({ visibility: "PUBLIC" });
  });

  it("ผู้ที่ล็อกอินแล้วไม่ถูกจำกัดด้วยการมองเห็น", () => {
    expect(visibleWhere(true)).not.toHaveProperty("visibility");
  });

  it("แสดงเฉพาะรายการที่เผยแพร่แล้วใน scope ปัจจุบัน", () => {
    expect(visibleWhere(true).status).toBe("PUBLISHED");
    expect(visibleWhere(false).status).toBe("PUBLISHED");
  });

  it("ไม่เอาโพสต์ต่อในเธรดขึ้นฟีด", () => {
    expect(visibleWhere(true).parentId).toBeNull();
    expect(visibleWhere(false).parentId).toBeNull();
  });
});

describe("threadChildWhere", () => {
  it("ผู้เยี่ยมชมเห็นเฉพาะ follow-up สาธารณะที่ไม่ใช่ draft/hidden", () => {
    expect(threadChildWhere(false)).toMatchObject({
      visibility: "PUBLIC",
      status: { in: ["PUBLISHED", "PAST"] },
    });
  });
});

describe("expiry", () => {
  const now = new Date("2026-09-20T12:00:00+07:00");

  it("รายการที่พ้นวันหมดเขตถือว่าจบแล้ว", () => {
    expect(isPast({ status: "PUBLISHED", expiresAt: new Date("2026-09-19") }, now)).toBe(true);
  });

  it("รายการที่ไม่มีวันหมดเขตไม่จบเองโดยเวลา", () => {
    expect(isPast({ status: "PUBLISHED", expiresAt: null }, now)).toBe(false);
  });

  it("รายการที่ผู้เขียนกดให้จบแล้วถือว่าจบ แม้ยังไม่ถึงวัน", () => {
    expect(isPast({ status: "PAST", expiresAt: new Date("2026-12-31") }, now)).toBe(true);
  });

  it("วันจากฟอร์มหมดเขตตอนสิ้นวันตามเวลาไทย", () => {
    expect(parseBangkokEndOfDay("2026-09-20")?.toISOString()).toBe(
      "2026-09-20T16:59:59.999Z"
    );
  });
});
