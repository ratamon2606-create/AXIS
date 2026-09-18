import { describe, expect, it } from "vitest";
import { visibleWhere, isPast } from "@/lib/items";

/**
 * ห้าเคสนี้ทดสอบฟังก์ชันล้วน ไม่ต้องต่อฐานข้อมูล จึงรันใน CI ได้ทันที
 *
 * เลือกทดสอบกฎการมองเห็นก่อนอย่างอื่น เพราะมันถูกเรียกจากสี่หน้า
 * การทดสอบหนึ่งครั้งจึงครอบคลุมทั้งสี่หน้า
 * ต่างจากการทดสอบหน้าเว็บที่ครอบคลุมหน้าเดียวและพังทุกครั้งที่แก้ markup
 */

describe("visibleWhere", () => {
  it("ผู้ที่ไม่ได้ล็อกอินเห็นเฉพาะรายการสาธารณะ", () => {
    // SRS-8 การรั่วไหลที่ร้ายแรงที่สุดคือลืมเงื่อนไขนี้
    expect(visibleWhere(false)).toMatchObject({ visibility: "PUBLIC" });
  });

  it("ผู้ที่ล็อกอินแล้วไม่ถูกจำกัดด้วยการมองเห็น", () => {
    expect(visibleWhere(true)).not.toHaveProperty("visibility");
  });

  it("แสดงเฉพาะรายการที่เผยแพร่แล้ว ไม่ว่าล็อกอินหรือไม่", () => {
    // SRS-1 ร่างและของที่ถูกซ่อนต้องไม่โผล่
    expect(visibleWhere(true).status).toBe("PUBLISHED");
    expect(visibleWhere(false).status).toBe("PUBLISHED");
  });

  it("ไม่เอาโพสต์ต่อในเธรดขึ้นฟีด", () => {
    // ถ้าไม่มีเงื่อนไขนี้ ฟีดจะมีข้อความแก้ไขปนกับประกาศต้นเรื่อง
    expect(visibleWhere(true).parentId).toBeNull();
    expect(visibleWhere(false).parentId).toBeNull();
  });
});

describe("isPast", () => {
  const now = new Date("2026-09-20T12:00:00+07:00");

  it("รายการที่พ้นวันหมดเขตถือว่าจบแล้ว", () => {
    expect(isPast({ status: "PUBLISHED", expiresAt: new Date("2026-09-19") }, now)).toBe(true);
  });

  it("รายการที่ไม่มีวันหมดเขตไม่จบเองโดยเวลา", () => {
    // SRS-26 เอกสารอ้างอิงเช่นรายชื่อห้องปฏิบัติการต้องอยู่ต่อ
    expect(isPast({ status: "PUBLISHED", expiresAt: null }, now)).toBe(false);
  });

  it("รายการที่ผู้เขียนกดให้จบแล้วถือว่าจบ แม้ยังไม่ถึงวัน", () => {
    // SRS-24 เช่นกิจกรรมที่เต็มก่อนกำหนด
    expect(isPast({ status: "PAST", expiresAt: new Date("2026-12-31") }, now)).toBe(true);
  });
});
