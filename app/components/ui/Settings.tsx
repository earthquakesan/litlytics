import { CurrencyDollarIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { MLCEngine } from '@mlc-ai/web-llm';
import { useAtom } from 'jotai';
import {
  LLMModelsList,
  LLMProvider,
  LLMProviders,
  LLMProvidersList,
  localModelSizes,
  modelCosts,
} from 'litlytics';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { configAtom, webllmAtom } from '~/store/store';
import { Badge } from '../catalyst/badge';
import { Button } from '../catalyst/button';
import { Description, Field, FieldGroup, Label } from '../catalyst/fieldset';
import { Input } from '../catalyst/input';
import { Select } from '../catalyst/select';
import { Spinner } from '../Spinner';
import { ProviderKeysHint, providerNames } from './ProviderKeys';
import { Recommended, recommendedForProvider } from './Recommended';

export function Settings({ close }: { close: () => void }) {
  const [webllm, setWebllm] = useAtom(webllmAtom);
  const [config, setConfig] = useAtom(configAtom);
  const [providers, setProviders] = useState<LLMProviders[]>([]);

  const provider = useMemo(() => config.provider ?? 'openai', [config]);
  const models = useMemo(() => LLMModelsList[provider], [provider]);

  useEffect(() => {
    async function loadProviders() {
      const prov: LLMProviders[] = structuredClone(
        LLMProvidersList
      ) as unknown as LLMProviders[];
      try {
        if (!navigator.gpu) {
          setProviders(prov);
          return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setProviders(prov);
          return;
        }

        const device = await adapter.requestDevice();
        if (!device) {
          setProviders(prov);
          return;
        }

        setProviders(['local', ...prov]);
      } catch (err) {
        console.error(err);
        setProviders(prov);
      }
    }
    loadProviders();
  }, []);

  const loadLocalModel = () => {
    if (!config.model) {
      return;
    }
    // create engine
    const engine = new MLCEngine();
    engine.setInitProgressCallback((initProgress) => {
      const textProgress = initProgress.text.split('[').at(1)?.split(']').at(0);
      const isFetching = initProgress.text.includes('Fetching');
      const isFinished = initProgress.text.includes('Finish');
      const [leftProgress, rightProgress] = textProgress?.split('/') ?? [
        '0',
        '1',
      ];
      const loadProgress = parseInt(leftProgress) / parseInt(rightProgress);
      // console.log({
      //   fetchProgress: isFetching ? initProgress.progress : 1,
      //   loadProgress,
      //   status: initProgress.text,
      // });
      setWebllm({
        engine,
        fetchProgress: isFetching ? initProgress.progress : 1,
        loadProgress: isFinished ? 1 : loadProgress,
        status: initProgress.text,
      });
      if (isFinished) {
        close();
      }
    });
    engine.reload(config.model);
    setWebllm({ engine, fetchProgress: 0, loadProgress: 0, status: '' });
  };

  return (
    <div className="max-w-full">
      <FieldGroup>
        <Field>
          <Label>Provider</Label>
          <div className="flex gap-2">
            <Select
              value={config.provider}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  provider: e.target.value as LLMProviders,
                  model: LLMModelsList[e.target.value as LLMProviders][0],
                  llmKey: '',
                }))
              }
            >
              {providers.map((prov) => (
                <option key={prov} value={prov}>
                  {prov == 'local' ? 'local' : providerNames[prov]}
                </option>
              ))}
            </Select>
            <Recommended />
          </div>
        </Field>

        <Field>
          <Label>Model</Label>
          {config.provider === 'ollama' && (
            <Input
              value={config.model}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  model: e.target.value,
                }))
              }
            />
          )}
          {config.provider !== 'ollama' && (
            <Select
              value={config.model}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  model: e.target.value,
                }))
              }
            >
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}{' '}
                  {recommendedForProvider[provider] === model
                    ? '(recommended)'
                    : ''}
                </option>
              ))}
            </Select>
          )}
          {config.provider !== 'local' && config.provider !== 'ollama' && (
            <Description className="flex gap-2">
              <Badge title="Input price (USD) per million tokens">
                Input: <CurrencyDollarIcon className="w-3 h-3" />{' '}
                {_.round(modelCosts[config.model!].input * 10000, 2)} / MTok
              </Badge>
              <Badge title="Output price (USD) per million tokens">
                Output: <CurrencyDollarIcon className="w-3 h-3" />{' '}
                {_.round(modelCosts[config.model!].output * 10000, 2)} / MTok
              </Badge>
            </Description>
          )}
        </Field>

        {config.provider === 'ollama' && (
          <Field>
            <Label>Ollama URL</Label>
            <Input
              type="text"
              placeholder="http://localhost:11434"
              value={config.llmKey}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  llmKey: e.target.value,
                }))
              }
            />
            <Description className="mt-4 mx-1 !text-xs">
              Please note that your Ollama instance must have CORS enabled for
              LitLytics to work correctly in browser environment.
            </Description>
          </Field>
        )}

        {config.provider !== 'local' && config.provider !== 'ollama' && (
          <Field>
            <Label>API Key</Label>
            <Input
              type="password"
              value={config.llmKey}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  llmKey: e.target.value,
                }))
              }
            />
            {Boolean(config.llmKey?.length) && (
              <Description>
                Your key is stored only in your browser and passed directly to
                API provider.
              </Description>
            )}
          </Field>
        )}

        {config.provider === 'local' && (
          <Field className="flex flex-col">
            <div className="flex items-center gap-2">
              <Button
                onClick={loadLocalModel}
                title={webllm.status ?? ''}
                disabled={webllm.fetchProgress !== -1}
              >
                {webllm.fetchProgress > -1 && webllm.fetchProgress < 1 ? (
                  <>
                    <Spinner className="w-3 h-3" />
                    Fetching {Math.round(webllm.fetchProgress * 100)}%
                  </>
                ) : webllm.loadProgress > -1 && webllm.loadProgress < 1 ? (
                  <>
                    <Spinner className="w-3 h-3" />
                    Loading {Math.round(webllm.loadProgress * 100)}%
                  </>
                ) : webllm.loadProgress === 1 ? (
                  'Model loaded'
                ) : (
                  'Load model'
                )}
              </Button>
              <Description>
                Download and use selected model locally. This model size is:{' '}
                <strong>{localModelSizes[config.model!]}mb</strong>
              </Description>
            </div>
            <Description className="mt-4 mx-1 !text-xs">
              Please note that local model are worse at generating pipelines
              that their larger counterparts.
            </Description>
          </Field>
        )}
      </FieldGroup>

      {!config.llmKey?.length &&
        config.provider !== 'local' &&
        config.provider !== 'ollama' && (
          <>
            <ProviderKeysHint provider={provider as LLMProvider} />
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon
                    aria-hidden="true"
                    className="h-5 w-5 text-red-400 dark:text-red-200"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Choose a provider, model and set a key for the provider of
                    your choice to get started!
                  </h3>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
