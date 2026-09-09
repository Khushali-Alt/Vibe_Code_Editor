"use client";

import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";

interface UseWebContainerProps {
  templateData: TemplateFolder;
}

interface UseWebContainerReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destroy: () => void;
}

// Keep ONE WebContainer instance for the browser session.
let webContainerInstance: WebContainer | null = null;

// Prevent multiple boot() calls happening at the same time.
let bootPromise: Promise<WebContainer> | null = null;

const bootWebContainer = async (): Promise<WebContainer> => {
  if (webContainerInstance) {
    return webContainerInstance;
  }

  if (bootPromise) {
    return bootPromise;
  }

  bootPromise = WebContainer.boot();

  try {
    webContainerInstance = await bootPromise;
    return webContainerInstance;
  } finally {
    bootPromise = null;
  }
};

export const useWebContainer = ({
  templateData,
}: UseWebContainerProps): UseWebContainerReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(
    webContainerInstance
  );

  useEffect(() => {
    let mounted = true;

    const initializeWebContainer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const container = await bootWebContainer();

        if (!mounted) return;

        setInstance(container);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize WebContainer:", error);

        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to initialize WebContainer"
          );
          setIsLoading(false);
        }
      }
    };

    initializeWebContainer();

    return () => {
      mounted = false;
    };
  }, []);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      if (!instance) {
        throw new Error("WebContainer instance is not available");
      }

      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");

        if (folderPath) {
          await instance.fs.mkdir(folderPath, {
            recursive: true,
          });
        }

        await instance.fs.writeFile(path, content);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to write file";

        console.error(`Failed to write file at ${path}:`, err);

        throw new Error(
          `Failed to write file at ${path}: ${errorMessage}`
        );
      }
    },
    [instance]
  );

  const destroy = useCallback(() => {
    if (webContainerInstance) {
      webContainerInstance.teardown();
      webContainerInstance = null;
      bootPromise = null;

      setInstance(null);
      setServerUrl(null);
    }
  }, []);

  return {
    serverUrl,
    isLoading,
    error,
    instance,
    writeFileSync,
    destroy,
  };
};