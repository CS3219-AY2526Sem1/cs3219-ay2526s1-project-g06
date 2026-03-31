import {Router} from "express";
import {createRouter} from "./subRouters/createRouter";
import {readRouter} from "./subRouters/readRouter";
import {updateRouter} from "./subRouters/updateRouter";
import {deleteRouter} from "./subRouters/deleteRouter";

const router = Router();

router.use(readRouter);
router.use(createRouter);
router.use(updateRouter);
router.use(deleteRouter);

export {router as questionMainRouter};