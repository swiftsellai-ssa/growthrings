/**
 * ConvertKit Email Signup Form
 *
 * Embedded ConvertKit form for email collection with success messaging
 */

'use client';

import React, { useEffect } from 'react';

export const ConvertKitForm: React.FC = () => {
  // Load ConvertKit script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://f.convertkit.com/ckjs/ck.5.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .formkit-form[data-uid="0ad547a96b"] * {
          box-sizing: border-box;
        }
        .formkit-form[data-uid="0ad547a96b"] {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          max-width: 700px;
          margin: 0 auto;
        }
        .formkit-form[data-uid="0ad547a96b"] [data-style="clean"] {
          width: 100%;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-fields {
          display: flex;
          flex-wrap: wrap;
          margin: 0 auto;
          gap: 10px;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-field {
          flex: 1 1 auto;
          min-width: 250px;
          margin: 0;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-submit {
          flex: 0 0 auto;
          position: relative;
          margin: 0;
          border: 0;
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          display: inline-block;
          text-align: center;
          font-size: 15px;
          font-weight: 500;
          padding: 14px 32px;
          overflow: hidden;
          background-color: rgb(59, 130, 246);
          transition: background-color 300ms ease;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-submit:hover,
        .formkit-form[data-uid="0ad547a96b"] .formkit-submit:focus {
          outline: none;
          background-color: rgb(37, 99, 235);
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-submit > span {
          display: block;
          transition: all 300ms ease-in-out;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-input {
          background: #ffffff;
          font-size: 15px;
          padding: 14px 16px;
          border: 1px solid #e3e3e3;
          flex: 1 0 auto;
          line-height: 1.4;
          margin: 0;
          transition: border-color ease-out 300ms;
          border-radius: 8px;
          width: 100%;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-input:focus {
          outline: none;
          border-color: rgb(59, 130, 246);
          transition: border-color ease 300ms;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-input::placeholder {
          color: inherit;
          opacity: 0.6;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-alert {
          background: #f9fafb;
          border: 1px solid #e3e3e3;
          border-radius: 8px;
          flex: 1 0 auto;
          list-style: none;
          margin: 0 0 15px 0;
          padding: 12px;
          text-align: center;
          width: 100%;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-alert:empty {
          display: none;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-alert-success {
          background: #d3fbeb;
          border-color: #10bf7a;
          color: #0c905c;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-alert-error {
          background: #fde8e2;
          border-color: #f2643b;
          color: #ea4110;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-spinner {
          display: flex;
          height: 0px;
          width: 0px;
          margin: 0 auto;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          overflow: hidden;
          text-align: center;
          transition: all 300ms ease-in-out;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-spinner > div {
          margin: auto;
          width: 12px;
          height: 12px;
          background-color: #fff;
          opacity: 0.3;
          border-radius: 100%;
          display: inline-block;
          animation: formkit-bouncedelay 1.4s infinite ease-in-out both;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-spinner > div:nth-child(1) {
          animation-delay: -0.32s;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-spinner > div:nth-child(2) {
          animation-delay: -0.16s;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-submit[data-active] .formkit-spinner {
          opacity: 1;
          height: 100%;
          width: 50px;
        }
        .formkit-form[data-uid="0ad547a96b"] .formkit-submit[data-active] .formkit-spinner ~ span {
          opacity: 0;
        }
        @keyframes formkit-bouncedelay {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        @media (max-width: 600px) {
          .formkit-form[data-uid="0ad547a96b"] .formkit-fields {
            flex-direction: column;
          }
          .formkit-form[data-uid="0ad547a96b"] .formkit-field,
          .formkit-form[data-uid="0ad547a96b"] .formkit-submit {
            width: 100%;
            min-width: 100%;
          }
        }
      ` }} />

      <form
        action="https://app.kit.com/forms/8616946/subscriptions"
        className="seva-form formkit-form"
        method="post"
        data-sv-form="8616946"
        data-uid="0ad547a96b"
        data-format="inline"
        data-version="5"
        data-options='{"settings":{"after_subscribe":{"action":"message","success_message":"Success! Now check your email to confirm your subscription.","redirect_url":""}}}'
      >
        <div data-style="clean">
          <ul className="formkit-alert formkit-alert-error" data-element="errors" data-group="alert"></ul>
          <div data-element="fields" data-stacked="false" className="seva-fields formkit-fields">
            <div className="formkit-field">
              <input
                className="formkit-input"
                name="email_address"
                aria-label="Email Address"
                placeholder="Enter your email address"
                required
                type="email"
              />
            </div>
            <button
              data-element="submit"
              className="formkit-submit formkit-submit"
              type="submit"
            >
              <div className="formkit-spinner">
                <div></div>
                <div></div>
                <div></div>
              </div>
              <span>Subscribe</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            Auto X API sync • Advanced analytics • Priority support
          </p>
        </div>
      </form>
    </>
  );
};

export default ConvertKitForm;