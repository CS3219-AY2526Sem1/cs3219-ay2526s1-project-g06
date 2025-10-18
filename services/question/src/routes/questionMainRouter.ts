import {Router} from "express";
import {createRouter} from "./subRouters/createRouter";
import {readRouter} from "./subRouters/readRouter";
import {updateRouter} from "./subRouters/updateRouter";
import {deleteRouter} from "./subRouters/deleteRouter";

const router = Router();

// TODO (compulsory): ensuring only admins can access certain routes  
// TODO (optional-compulsory if performance lacking): cache + cache invalidation (reset) on create, update, delete operations. Issue is edge case of staleness. 
// TODO (optional): create multiple qns with checks (slow), multiple calls to single qn
// TODO (optional): create multiple questions (fast), no checks (use carefully)
// TODO (optional): update multiple qns 
// TODO (optional): delete multiple qns based on ids

router.use(readRouter);
router.use(createRouter);
router.use(updateRouter);
router.use(deleteRouter);

export {router as questionMainRouter};