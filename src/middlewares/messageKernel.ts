import { StatusCodes } from "http-status-codes";
import express, { Router } from 'express';
import { create } from "lodash";
import { Path, saveFileWithRetry } from "../utils/files";
import { FileDto, PathInfo } from "../types/dtos/fileDto";
import { UploadedFile } from "express-fileupload";
import { errorMiddleware } from "..";
import { HttpError } from "../types/errors/httpError";


// responds back to the frontend over API.
// The respondance of the result will happen over websocket 
const respondToInitialRequest = (req: express.Request, res: express.Response, msg: StatusCodes) => {

  // res.json(msg);
  // res.status(400).send('bad reqeust');

  // if error
  // errorMiddleware(new HttpError(StatusCodes.CONFLICT, "X", "why not"), req, res, null)
  res.status(StatusCodes.ACCEPTED)


}


export const messageKernel = async (req: express.Request, res: express.Response, messageAction: string) => {

  console.log(">>> MERNEL [", new Date(), "] <<<", messageAction)





  switch (messageAction) {
    case "handleUpload":
      console.log("its handle upload")
      //check requirements for handleupload (e.g. file is added)
      //respond to request
      respondToInitialRequest(req, res, StatusCodes.ACCEPTED)
      //handle request
      handleUpload(req.files.newFiles, req.body);
      return;
    default:
      console.log("resulted to default messageaction")
  }

  return;


}


const handleUpload = async (files: UploadedFile[] | UploadedFile, dto: FileDto) => {
  console.log("UPLOAD REQUEST RECEIVED", files, dto)
  if (!dto.path) dto.path = '/';
  if (Array.isArray(files)) {
    console.log("array of files")
    const results = [] as PathInfo[];
    await Promise.all(
      files.map(async f => {
        const path = new Path(dto.path);
        path.appendPath(f.name);
        const result = await saveFileWithRetry(path, f);
        results.push(result);
      })
    );
    res.json(results);
    res.status(StatusCodes.CREATED);

    // send this message though websocket, catch and dispatch to messageKernel
    return;
  }

  const path = new Path(dto.path);
  path.appendPath((files as UploadedFile).name);
  const result = await saveFileWithRetry(path, files as UploadedFile);
  res.json(result);
  res.status(StatusCodes.CREATED);
}


