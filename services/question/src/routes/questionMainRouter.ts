import {Router} from "express";
import {createRouter} from "./subRouters/createRouter";
import {readRouter} from "./subRouters/readRouter";
import {updateRouter} from "./subRouters/updateRouter";
import {deleteRouter} from "./subRouters/deleteRouter";
import {checkUser} from "../middleware/userAuth";
import {checkAdmin} from "../middleware/adminAuth";

const router = Router();

//new branch
// TODO: ensuring only users authenticated admins can access certain routes  
// TODO: Easy, Medium, Hard ordering 

// user validation
router.use(checkUser);

router.use(readRouter);

// admin validation
router.use(checkAdmin);

router.use(createRouter);
router.use(updateRouter);
router.use(deleteRouter);

export {router as questionMainRouter};