using {enterprise.common as common} from '../../db/schema';


@path    : '/common'
@requires: 'authenticated-user'
service CommonService {
    @readonly
    entity Statuses as projection on common.Statuses;

    // TEST
    function ping() returns String;
}
