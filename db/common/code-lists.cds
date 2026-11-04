namespace enterprise.common;

using {sap.common.CodeList} from '@sap/cds/common';

entity Statuses : CodeList {
    key code : String(30);
}

entity LeaveTypes : CodeList {
    key code : String(20);
}