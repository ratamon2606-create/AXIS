"use client";

import { useState } from "react";
import {
  AUDIENCE_LABEL,
  TYPE_FIELDS,
  TYPE_LABEL,
} from "@/lib/items";
import { removeAttachment } from "@/app/actions/attachments";

type ExistingAttachment = {
  id: string;
  fileName: string;
  size: number;
};

type Values = {
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  audience?: string;
  targetYear?: number | null;
  visibility?: string;
  status?: string;
  eventStart?: string;
  eventEnd?: string;
  expiresAt?: string;
  location?: string;
  details?: Record<string, string>;
  attachments?: ExistingAttachment[];
};

const TYPES = [
  "NEWS",
  "OPPORTUNITY",
  "ACTIVITY",
  "ALERT",
  "DOCUMENT",
];

const AUDIENCES = [
  "ALL",
  "CPE",
  "SKE",
  "CPE_SKE",
];

export default function ItemForm({
  action,
  values = {},
  mode,
}: {
  action: (
    formData: FormData,
  ) => void | Promise<void>;

  values?: Values;

  mode: "create" | "edit";
}) {
  const [type, setType] =
    useState(
      values.type ?? "ACTIVITY",
    );

  const [
    visibility,
    setVisibility,
  ] = useState(
    values.visibility ?? "KU_ONLY",
  );

  const [
    errors,
    setErrors,
  ] = useState<
    Record<string, string>
  >({});

  const field =
    "min-h-11 w-full rounded-xl border bg-paper px-3 py-2.5 text-sm outline-none";

  const ok =
    "border-line focus:border-brand";

  const bad =
    "border-danger bg-dangersoft/40";

  function check(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    const fd =
      new FormData(
        e.currentTarget,
      );

    const next:
      Record<string, string> = {};

    // validate files
    const files = fd
      .getAll("attachments")
      .filter(
        (
          value,
        ): value is File =>
          value instanceof File &&
          value.size > 0,
      );

    const tooLarge =
      files.find(
        (file) =>
          file.size >
          20 * 1024 * 1024,
      );

    if (tooLarge) {
      next.attachments =
        `${tooLarge.name} ใหญ่เกิน 20 MB`;
    }

    const totalBytes =
      files.reduce(
        (
          sum,
          file,
        ) =>
          sum + file.size,
        0,
      );

    if (
      totalBytes >
      80 * 1024 * 1024
    ) {
      next.attachments =
        "ไฟล์แนบรวมกันต้องไม่เกิน 80 MB ต่อการบันทึกหนึ่งครั้ง";
    }

    // check required fields
    if (
      !String(
        fd.get("title") ?? "",
      ).trim()
    ) {
      next.title =
        "ต้องมีหัวข้อก่อนบันทึก";
    }

    if (
      !String(
        fd.get("body") ?? "",
      ).trim()
    ) {
      next.body =
        "ต้องมีเนื้อหาก่อนบันทึก";
    }

    if (
      !AUDIENCES.includes(
        String(
          fd.get(
            "audience",
          ) ?? "",
        ),
      )
    ) {
      next.audience =
        "ต้องเลือกกลุ่มเป้าหมาย";
    }

    if (
      Object.keys(
        next,
      ).length
    ) {
      e.preventDefault();

      setErrors(
        next,
      );

      return;
    }

    setErrors({});
  }

  return (
    <form
      action={action}
      onSubmit={check}
      className="space-y-5"
    >
      {values.id && (
        <input
          type="hidden"
          name="id"
          value={values.id}
        />
      )}

      {/* error summary */}
      {Object.keys(
        errors,
      ).length > 0 && (
        <div
          role="alert"
          className="rounded-xl bg-dangersoft px-4 py-3 text-sm text-danger"
        >
          <p>
            บันทึกไม่สำเร็จ · พบ{" "}
            {
              Object.keys(
                errors,
              ).length
            }{" "}
            จุดที่ต้องแก้
          </p>

          {errors.attachments && (
            <p className="mt-1 text-xs">
              {
                errors.attachments
              }
            </p>
          )}
        </div>
      )}

      {/* 1. main content */}
      <fieldset
        className="axis-panel axis-form-section"
        aria-labelledby="axis-form-section-main"
      >
        <div
          id="axis-form-section-main"
          className="axis-form-section-title"
        >
          <span className="axis-form-section-number">
            1.
          </span>

          <span>
            เนื้อหาหลัก
          </span>
        </div>

        <div className="space-y-4">
          {/* type */}
          <div>
            <span className="mb-2 block text-sm font-medium">
              ประเภท
            </span>

            <div className="axis-filter-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
              {TYPES.map(
                (value) => (
                  <button
                    key={
                      value
                    }
                    type="button"
                    onClick={() =>
                      setType(
                        value,
                      )
                    }
                    className={[
                      "min-h-10 shrink-0 rounded-full border px-3 text-xs",

                      type ===
                      value
                        ? "border-brand bg-brandsoft font-medium text-branddeep"
                        : "border-line bg-paper text-muted",
                    ].join(
                      " ",
                    )}
                  >
                    {
                      TYPE_LABEL[
                        value
                      ]
                    }
                  </button>
                ),
              )}
            </div>

            <input
              type="hidden"
              name="type"
              value={type}
            />
          </div>

          {/* title */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              หัวข้อ
            </span>

            <input
              name="title"
              defaultValue={
                values.title
              }
              className={`${field} ${
                errors.title
                  ? bad
                  : ok
              }`}
              aria-invalid={
                !!errors.title
              }
            />

            {errors.title && (
              <span className="mt-1 block text-xs text-danger">
                {
                  errors.title
                }
              </span>
            )}
          </label>

          {/* body */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              เนื้อหา
            </span>

            <textarea
              name="body"
              rows={7}
              defaultValue={
                values.body
              }
              className={`${field} min-h-40 resize-y ${
                errors.body
                  ? bad
                  : ok
              }`}
              aria-invalid={
                !!errors.body
              }
            />

            {errors.body && (
              <span className="mt-1 block text-xs text-danger">
                {
                  errors.body
                }
              </span>
            )}
          </label>
        </div>
      </fieldset>

      {/* 2. target & schedule */}
      <fieldset
        className="axis-panel axis-form-section"
        aria-labelledby="axis-form-section-target"
      >
        <div
          id="axis-form-section-target"
          className="axis-form-section-title"
        >
          <span className="axis-form-section-number">
            2.
          </span>

          <span>
            กลุ่มเป้าหมายและเวลา
          </span>
        </div>

        <p className="mb-4 text-xs leading-5 text-muted">
          กลุ่มเป้าหมายและชั้นปีใช้บอกความเกี่ยวข้องของประกาศ
          ส่วนการมองเห็นด้านล่างเป็นตัวควบคุมสิทธิ์การเปิดจริง
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* audience */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              กลุ่มเป้าหมาย
            </span>

            <select
              name="audience"
              defaultValue={
                values.audience ??
                "ALL"
              }
              className={`${field} ${
                errors.audience
                  ? bad
                  : ok
              }`}
            >
              {AUDIENCES.map(
                (value) => (
                  <option
                    key={
                      value
                    }
                    value={
                      value
                    }
                  >
                    {
                      AUDIENCE_LABEL[
                        value
                      ]
                    }
                  </option>
                ),
              )}
            </select>

            {errors.audience && (
              <span className="mt-1 block text-xs text-danger">
                {
                  errors.audience
                }
              </span>
            )}
          </label>

          {/* target year */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              ชั้นปีเป้าหมาย
            </span>

            <select
              name="targetYear"
              defaultValue={
                values.targetYear ??
                ""
              }
              className={`${field} ${ok}`}
            >
              <option value="">
                ทุกชั้นปี
              </option>

              {[
                1,
                2,
                3,
                4,
              ].map(
                (
                  year,
                ) => (
                  <option
                    key={
                      year
                    }
                    value={
                      year
                    }
                  >
                    ปี{" "}
                    {
                      year
                    }
                  </option>
                ),
              )}
            </select>
          </label>

          {/* location */}
          <label className="block md:col-span-2 xl:col-span-1">
            <span className="mb-1.5 block text-sm font-medium">
              สถานที่
            </span>

            <input
              name="location"
              defaultValue={
                values.location ??
                ""
              }
              className={`${field} ${ok}`}
              placeholder="เช่น ห้อง S603 หรือออนไลน์"
            />
          </label>

          {/* event start */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              เริ่มกิจกรรม
            </span>

            <input
              type="datetime-local"
              name="eventStart"
              defaultValue={
                values.eventStart ??
                ""
              }
              className={`${field} ${ok}`}
            />
          </label>

          {/* event end */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              จบกิจกรรม
            </span>

            <input
              type="datetime-local"
              name="eventEnd"
              defaultValue={
                values.eventEnd ??
                ""
              }
              className={`${field} ${ok}`}
            />
          </label>

          {/* expires at */}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              วันหมดเขต
            </span>

            <input
              type="date"
              name="expiresAt"
              defaultValue={
                values.expiresAt ??
                ""
              }
              className={`${field} ${ok}`}
            />
          </label>
        </div>
      </fieldset>

      {/* 3. details & files */}
      <fieldset
        className="axis-panel axis-form-section"
        aria-labelledby="axis-form-section-files"
      >
        <div
          id="axis-form-section-files"
          className="axis-form-section-title"
        >
          <span className="axis-form-section-number">
            3.
          </span>

          <span>
            รายละเอียดและไฟล์
          </span>
        </div>

        <div className="rounded-xl bg-brandsoft px-3 py-2.5 text-xs leading-6 text-branddeep">
          ช่องเสริมจะเปลี่ยนตามประเภทประกาศ ·{" "}
          {
            TYPE_LABEL[
              type
            ]
          }
        </div>

        {(TYPE_FIELDS[
          type
        ] ?? []).length >
          0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {(
              TYPE_FIELDS[
                type
              ] ?? []
            ).map(
              (f) => (
                <label
                  key={
                    f.key
                  }
                  className="block"
                >
                  <span className="mb-1.5 block text-sm font-medium">
                    {
                      f.label
                    }
                  </span>

                  <input
                    name={`d_${f.key}`}
                    defaultValue={
                      values
                        .details?.[
                        f.key
                      ] ??
                      ""
                    }
                    className={`${field} ${ok}`}
                  />
                </label>
              ),
            )}
          </div>
        )}

        {/* attachments */}
        <label className="mt-4 block rounded-xl border border-dashed border-line p-4">
          <span className="mb-1.5 block text-sm font-medium">
            ไฟล์แนบ / รูปภาพ
          </span>

          <input
            type="file"
            name="attachments"
            multiple
            className="w-full text-sm"
          />

          <span className="mt-1 block text-xs text-muted">
            เพิ่มไฟล์ได้ก่อนเผยแพร่
            · สูงสุด 20 MB
            ต่อไฟล์
          </span>

          <span className="mt-1 block text-xs font-medium text-branddeep">
            รูปภาพแรกที่แนบจะใช้เป็นโปสเตอร์ของประกาศและเป็นปกบนชั้นหนังสืออัตโนมัติ
            โดยไม่นับไฟล์ PDF
            และเอกสารสำนักงาน
          </span>
        </label>

        {/* existing files */}
        {values.attachments &&
          values
            .attachments
            .length >
            0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">
                ไฟล์ปัจจุบัน
              </p>

              {values.attachments.map(
                (
                  file,
                ) => (
                  <div
                    key={
                      file.id
                    }
                    className="flex items-center gap-3 rounded-xl bg-wash px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {
                        file.fileName
                      }
                    </span>

                    <button
                      type="submit"
                      formAction={async () => {
                        const data =
                          new FormData();

                        data.set(
                          "attachmentId",
                          file.id,
                        );

                        await removeAttachment(
                          data,
                        );
                      }}
                      className="min-h-9 rounded-lg px-2 text-xs text-danger"
                    >
                      ลบ
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
      </fieldset>

      {/* 4. visibility & status */}
      <fieldset
        className="axis-panel axis-form-section"
        aria-labelledby="axis-form-section-access"
      >
        <div
          id="axis-form-section-access"
          className="axis-form-section-title"
        >
          <span className="axis-form-section-number">
            4.
          </span>

          <span>
            การมองเห็นและสถานะ
          </span>
        </div>

        <p className="mb-3 text-xs leading-5 text-muted">
          การมองเห็นคือการควบคุมสิทธิ์การเข้าถึงจริง
          ค่าเริ่มต้นเป็นเฉพาะบัญชีมหาวิทยาลัย
          เพื่อป้องกันการเปิดข้อมูลภายในโดยไม่ตั้งใจ
        </p>

        <input
          type="hidden"
          name="visibility"
          value={
            visibility
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              v: "KU_ONLY",
              t: "🔒 เฉพาะบัญชีมหาวิทยาลัย",
              d: "ค่าเริ่มต้น ปลอดภัยไว้ก่อน",
            },
            {
              v: "PUBLIC",
              t: "🌏 ทุกคน",
              d: "ใช้เมื่อข้อมูลเปิดให้คนนอกได้จริง",
            },
          ].map(
            (
              option,
            ) => (
              <button
                key={
                  option.v
                }
                type="button"
                onClick={() =>
                  setVisibility(
                    option.v,
                  )
                }
                className={[
                  "min-h-24 rounded-xl bg-paper p-4 text-left text-sm ring-1",

                  visibility ===
                  option.v
                    ? "ring-2 ring-brand"
                    : "ring-line/60",
                ].join(
                  " ",
                )}
              >
                <span className="font-medium">
                  {
                    option.t
                  }
                </span>

                <span className="mt-1 block text-xs leading-5 text-muted">
                  {
                    option.d
                  }
                </span>
              </button>
            ),
          )}
        </div>

        {/* status */}
        {mode ===
          "create" ||
        values.status ===
          "DRAFT" ? (
          <label className="mt-4 block max-w-sm">
            <span className="mb-1.5 block text-sm font-medium">
              สถานะ
            </span>

            <select
              name="status"
              defaultValue={
                values.status ??
                "DRAFT"
              }
              className={`${field} ${ok}`}
            >
              <option value="DRAFT">
                บันทึกร่าง
              </option>

              <option value="PUBLISHED">
                เผยแพร่
              </option>
            </select>
          </label>
        ) : (
          <input
            type="hidden"
            name="status"
            value={
              values.status ??
              "PUBLISHED"
            }
          />
        )}
      </fieldset>

      {/* save bar */}
      <div className="sticky bottom-[4.25rem] z-10 rounded-2xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur md:bottom-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-xs text-muted">
            ตรวจกลุ่มเป้าหมาย
            การมองเห็น
            และวันที่อีกครั้งก่อนบันทึก
          </p>

          <button className="min-h-11 rounded-xl bg-brand px-5 text-sm text-white sm:ml-auto sm:min-w-44">
            {mode ===
            "create"
              ? "บันทึกประกาศ"
              : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>
    </form>
  );
}