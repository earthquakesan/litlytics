import { useAtom, useAtomValue } from 'jotai';
import { LitLytics } from 'litlytics';
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import {
  configAtom,
  litlyticsAtom,
  litlyticsInitedAtom,
  webllmAtom,
} from './store';
import { createReactiveProxy } from './util';

const LitLyticsContext = createContext<{ litlytics?: LitLytics }>({
  litlytics: undefined,
});

export function WithLitLytics({ children }: { children: React.ReactNode }) {
  const saveConfigRef = useRef<Timer>();
  const webllm = useAtomValue(webllmAtom);
  const [config, setConfig] = useAtom(configAtom);
  const [isInited, setIsInited] = useAtom(litlyticsInitedAtom);
  const [litlytics, setLitlytics] = useAtom(litlyticsAtom);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  // create proxy that triggers state updates
  // only create it once and use context to pass it around
  useEffect(() => {
    if (isInited) {
      return;
    }
    const ll = new LitLytics({
      provider: 'openai',
      model: 'gpt-4o-mini',
      key: '',
    });
    setLitlytics(
      createReactiveProxy(ll, () => {
        // if there's current save timeout - reset it
        if (saveConfigRef.current) {
          clearTimeout(saveConfigRef.current);
        }
        // persist changes in localStorage after some time of inactivity
        saveConfigRef.current = setTimeout(() => {
          setConfig(ll.exportConfig());
        }, 500);
        // force UI update
        forceUpdate();
      })
    );
    // set inited flag
    setIsInited(true);
    // assign initial config and webEngine instance
    ll.importConfig(config);
    ll.setWebEngine(webllm.engine);
  }, [isInited, config, webllm, setIsInited, setLitlytics, setConfig]);

  // update config / llm on changes
  useEffect(() => {
    // assign updated config
    const cfg = litlytics.exportConfig();
    if (
      cfg.provider !== config.provider ||
      cfg.model !== config.model ||
      cfg.llmKey !== config.llmKey
    ) {
      litlytics.importConfig(config);
    }
    // assign webllm engine
    if (litlytics.getEngine() !== webllm.engine) {
      litlytics.setWebEngine(webllm.engine);
    }
  }, [config, webllm, litlytics]);

  return (
    <LitLyticsContext.Provider value={{ litlytics }}>
      {children}
    </LitLyticsContext.Provider>
  );
}

export const useLitlytics = () => {
  const { litlytics } = useContext(LitLyticsContext);
  return litlytics!;
};
