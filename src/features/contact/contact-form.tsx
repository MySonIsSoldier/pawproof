"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";
import {
  contactCategoryLabels,
  contactCategoryValues,
} from "../../application/contracts/contact.ts";
import { Icon } from "../../components/icon";
import { apiPath } from "../../config/public";

declare global {
  interface Window {
    pawproofTurnstileCallback?: (token: string) => void;
    pawproofTurnstileExpired?: () => void;
    pawproofTurnstileError?: () => void;
    turnstile?: { reset: () => void };
  }
}

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState<(typeof contactCategoryValues)[number]>(
    "service",
  );
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<
    | { type: "idle" }
    | { type: "sending" }
    | { type: "success" }
    | { type: "error"; message: string }
  >({ type: "idle" });

  useEffect(() => {
    if (!turnstileSiteKey) return;
    window.pawproofTurnstileCallback = setTurnstileToken;
    window.pawproofTurnstileExpired = () => setTurnstileToken("");
    window.pawproofTurnstileError = () => setTurnstileToken("");
    return () => {
      delete window.pawproofTurnstileCallback;
      delete window.pawproofTurnstileExpired;
      delete window.pawproofTurnstileError;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.type === "sending") return;
    setState({ type: "sending" });

    try {
      const response = await fetch(apiPath("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          category,
          message,
          website,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !result.ok) {
        window.turnstile?.reset();
        setTurnstileToken("");
        throw new Error(result.error || "문의가 전송되지 않았어요.");
      }
      setState({ type: "success" });
      setEmail("");
      setWebsite("");
      setMessage("");
      setCategory("service");
    } catch (error) {
      setState({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "문의가 전송되지 않았어요. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  if (state.type === "success") {
    return (
      <section className="contact-success" aria-live="polite">
        <span className="contact-success-icon">
          <Icon name="check" size={25} />
        </span>
        <p className="eyebrow">MESSAGE RECEIVED</p>
        <h2>문의가 잘 도착했어요.</h2>
        <p>
          확인하고 답변드릴게요. 보내주신 이메일 주소로 회신할 예정이에요.
        </p>
        <button
          className="text-button"
          type="button"
          onClick={() => setState({ type: "idle" })}
        >
          다른 문의 보내기 <Icon name="arrow" size={16} />
        </button>
      </section>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      )}
      <div className="contact-form-heading">
        <div>
          <p className="eyebrow">
            <span /> WRITE TO US
          </p>
          <h2>어떤 점이 궁금했나요?</h2>
        </div>
        <Icon name="paw" size={28} />
      </div>

      <div className="contact-fields">
        <label className="contact-field">
          <span>답변받을 이메일</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className="contact-field">
          <span>문의 유형</span>
          <select
            name="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof contactCategoryValues)[number])
            }
          >
            {contactCategoryValues.map((value) => (
              <option key={value} value={value}>
                {contactCategoryLabels[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="contact-field">
        <span>문의 내용</span>
        <textarea
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="예: 파주 지역 장소 정보 중 최신 운영 조건을 확인하고 싶어요."
          rows={7}
          minLength={10}
          maxLength={2_000}
          required
        />
        <small>{message.length}/2,000</small>
      </label>

      <label className="contact-honeypot" aria-hidden="true">
        웹사이트
        <input
          tabIndex={-1}
          name="website"
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </label>

      {turnstileSiteKey && (
        <div
          className="cf-turnstile contact-turnstile"
          data-sitekey={turnstileSiteKey}
          data-action="turnstile-spin-v1"
          data-callback="pawproofTurnstileCallback"
          data-expired-callback="pawproofTurnstileExpired"
          data-error-callback="pawproofTurnstileError"
        />
      )}

      <div className="contact-form-footer">
        <p>
          보내주신 내용은 답변을 위해 이메일로만 전달돼요. 비밀번호나 민감한
          개인정보는 입력하지 말아 주세요.
        </p>
        <button
          className="button"
          type="submit"
          disabled={state.type === "sending" || Boolean(turnstileSiteKey && !turnstileToken)}
        >
          {state.type === "sending" ? "보내는 중…" : "문의 보내기"}
          <Icon name="arrow" size={17} />
        </button>
      </div>
      {state.type === "error" && (
        <p className="contact-feedback contact-feedback-error" role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
