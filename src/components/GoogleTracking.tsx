import DeferredTrackingScripts from "./DeferredTrackingScripts";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "";

const hasGtm = /^GTM-[A-Z0-9]+$/i.test(gtmId);

export default function GoogleTracking() {
  return (
    <>
      {hasGtm ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      ) : null}

      <DeferredTrackingScripts
        gtmId={hasGtm ? gtmId : ""}
      />
    </>
  );
}
