import { runPipeline } from '@/src/engine/runPipeline';
import { DocumentIcon } from '@heroicons/react/24/outline';
import {
  ArrowDownTrayIcon,
  ArrowRightEndOnRectangleIcon,
  Bars3Icon,
  Cog8ToothIcon,
  FolderIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { useAtom } from 'jotai';
import { pipelineAtom } from '../store/store';
import { Button } from './catalyst/button';
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from './catalyst/dropdown';
import { ViewResults } from './pipeline/result/ViewResult';

function MenuHolder({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-fit h-fit bg-white dark:bg-neutral-800 p-1.5 gap-1.5 isolate inline-flex rounded-lg shadow-sm pointer-events-auto ${className}`}
    >
      {children}
    </div>
  );
}

export function PipelineUI() {
  const [pipeline, setPipeline] = useAtom(pipelineAtom);

  const doRunPipeline = async () => {
    const newPipeline = await runPipeline(pipeline);
    console.log(newPipeline);
    setPipeline(structuredClone(newPipeline));
  };

  return (
    <div className="fixed pointer-events-none my-6 px-4 z-10 h-screen w-screen bg-transparent">
      <div className="flex justify-between w-full h-fit">
        <MenuHolder className="p-0 m-1.5">
          <Dropdown>
            <DropdownButton>
              <Bars3Icon />
            </DropdownButton>
            <DropdownMenu
              className="min-w-80 lg:min-w-64"
              anchor="bottom start"
            >
              <DropdownItem>
                <FolderIcon aria-hidden="true" className="h-5 w-5" />
                <DropdownLabel>Open pipeline</DropdownLabel>
              </DropdownItem>

              <DropdownItem>
                <ArrowDownTrayIcon aria-hidden="true" className="h-5 w-5" />
                <DropdownLabel>Save pipeline</DropdownLabel>
              </DropdownItem>

              <DropdownDivider />

              <DropdownItem>
                <Cog8ToothIcon />
                <DropdownLabel>Settings</DropdownLabel>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </MenuHolder>

        <MenuHolder>
          <Button title="Generate pipeline">
            <SparklesIcon aria-hidden="true" className="h-5 w-5" />
          </Button>

          <div className="w-1" />

          <Button title="Add source">
            <DocumentIcon aria-hidden="true" className="h-5 w-5" />
          </Button>
          <Button title="Add step">
            <ArrowRightEndOnRectangleIcon
              aria-hidden="true"
              className="h-5 w-5"
            />
          </Button>

          <div className="w-1" />

          <Button title="Run pipeline" onClick={doRunPipeline}>
            <PlayIcon aria-hidden="true" className="h-5 w-5" />
          </Button>

          <ViewResults />
        </MenuHolder>

        <MenuHolder className="p-0 m-1.5">
          <Button title="Help">
            <QuestionMarkCircleIcon aria-hidden="true" className="h-5 w-5" />
          </Button>
        </MenuHolder>
      </div>
    </div>
  );
}
