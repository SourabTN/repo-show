"use client";
import JSZip from "jszip";
import React, { useEffect, useState } from "react";
import { format } from "date-fns";

type RepoShowProps = {};

function RepoShow({}: RepoShowProps) {
  const [data, setData]: any = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [id, setId] = useState();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "https://api.github.com/users/abuanwar072/repos"
        );
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // console.log(id);

  const handleDownload = async (repoName: string) => {
    setDownloading(true);
    const repo = data.find((repo: any) => repo.name === repoName);
    setId(repo.id);
    // console.log(repo);

    const filesResponse = await fetch(repo.contents_url.replace("{+path}", ""));
    const files = await filesResponse.json();

    const zip = new JSZip();

    const requests = files.map(
      async (file: { download_url: string; name: string }) => {
        const fileName = file.name;
        const fileContentResponse = await fetch(file.download_url);
        const fileContent = await fileContentResponse.blob();
        zip.file(fileName, fileContent);
      }
    );

    await Promise.all(requests);

    zip
      .generateAsync({ type: "blob" })
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `${repoName}.zip`;
        link.click();
        setDownloading(false);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 text-center font-bold text-xl">
        GitHub Repo Portfolio
      </div>
      {isLoading ? (
        <div className="text-center w-full col-span-2">Getting Data...</div>
      ) : (
        data?.map((repo: any, idx: number) => (
          <div
            key={idx}
            className="bg-white py-4 px-4 rounded-xl flex flex-col gap-4"
          >
            <div className="h-full">
              <p className=" text-lg font-medium">Project #{idx + 1}</p>
              <p className=" text-lg ">
                <span className="font-medium">Project Name:</span> {repo.name}
              </p>
              <p className=" text-lg ">
                <span className="font-medium">Created At:</span>{" "}
                {formatDate(repo.created_at)}
              </p>
              {repo.language && (
                <p className=" text-lg ">
                  <span className="font-medium">Language:</span> {repo.language}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDownload(repo.name)}
              className="bg-blue-500 w-fit self-end px-4 py-1.5 rounded-lg text-white font-semibold hover:bg-blue-700"
            >
              {repo.id === id && downloading ? "Downloading..." : "Download"}
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default RepoShow;

export function formatDate(input: any) {
  const date = new Date(input);
  return format(date, "MMMM d, yyyy 'at' h:mm a");
}
