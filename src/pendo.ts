const PENDO_PUBLIC_APP_ID = "3a78a3f2-cbae-49c0-b2bb-58976f62ba5b";

type PendoInitOptions = {
  visitor?: Record<string, unknown>;
  account?: Record<string, unknown>;
};

type PendoMethod = (...args: unknown[]) => void;

type PendoAgent = {
  initialize?: (options: PendoInitOptions) => void;
  identify?: PendoMethod;
  updateOptions?: PendoMethod;
  pageLoad?: PendoMethod;
  track?: PendoMethod;
  _q?: unknown[][];
};

type PendoQueuedMethod = keyof Omit<PendoAgent, "_q">;

declare global {
  interface Window {
    pendo?: PendoAgent;
  }
}

let didInitialize = false;

function queuePendoCall(agent: PendoAgent, method: PendoQueuedMethod): PendoMethod {
  return (...args: unknown[]) => {
    agent._q = agent._q || [];
    const queuedCall = [method, ...args];

    if (method === "initialize") {
      agent._q.unshift(queuedCall);
      return;
    }

    agent._q.push(queuedCall);
  };
}

function installPendoAgent(publicAppId: string) {
  const agent = (window.pendo = window.pendo || {});

  if (!agent.initialize) {
    agent.initialize = queuePendoCall(agent, "initialize") as PendoAgent["initialize"];
    agent.identify = queuePendoCall(agent, "identify");
    agent.updateOptions = queuePendoCall(agent, "updateOptions");
    agent.pageLoad = queuePendoCall(agent, "pageLoad");
    agent.track = queuePendoCall(agent, "track");
  }

  if (document.querySelector(`script[src*="/agent/static/${publicAppId}/pendo.js"]`)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://cdn.pendo.io/agent/static/${publicAppId}/pendo.js`;

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

export function initializePendo() {
  if (didInitialize || !import.meta.env.PROD) {
    return;
  }

  didInitialize = true;
  installPendoAgent(PENDO_PUBLIC_APP_ID);
  window.pendo?.initialize?.({
    visitor: {},
    account: {},
  });
}
