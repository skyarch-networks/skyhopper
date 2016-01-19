//
// Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
//
// This software is released under the MIT License.
//
// http://opensource.org/licenses/mit-license.php
//

module.exports = function(data){
  return {
    style: 'tableExample',
    color: '#444',
    table: {
        widths: [ 120, 100, 'auto', 'auto', 'auto', 'auto',  'auto', 'auto', 'auto', 'auto'],
        // keepWithHeaderRows: 1,
        body: buildTableBody(data)
    }
  };

};

function is_null_port(port){
  if(port)
    return port;
  else
    return 'All';
}

function buildTableBody(data) {
    var body = [];
    var firstRow = [{ rowSpan: 2, text: 'Description',  style: 'tableHeader' },
            { rowSpan: 2, text: 'Group ID',style: 'tableHeader' },
            { colSpan: 4, text: 'Inbound', style: 'tableHeader' },
            'x','x','xx',
            { colSpan: 4, text: 'Outbound', style: 'tableHeader' },
            'x', 'x', 'x',];
    var secondRow = ['x' , 'x',
      {text: 'Type', style: 'tableHeader' },
      {text: 'Protocol', style: 'tableHeader' },
      {text: 'Source',  style: 'tableHeader' },
      {text: 'Port Range',  style: 'tableHeader' },
      {text: 'Type',  style: 'tableHeader' },
      {text: 'Protocol', style: 'tableHeader' },
      {text: 'Port Range', style: 'tableHeader' },
      {text: 'Source',  style: 'tableHeader' },
    ];

    body.push(firstRow, secondRow);

    data.forEach(function(v) {
      body.push([{text: v.description, style: 'tableHeader', rowSpan: v.ip_permissions.length},
               {text: v.group_id, style: 'tableHeader', rowSpan: v.ip_permissions.length},
               v.ip_permissions[0].user_id_group_pairs,
               v.ip_permissions[0].ip_protocol,
               is_null_port(v.ip_permissions[0].from_port.toString()),
               v.ip_permissions[0].ip_ranges[0].cidr_ip,
               v.ip_permissions_egress[0].user_id_group_pairs,
               v.ip_permissions_egress[0].ip_protocol,
               is_null_port(v.ip_permissions_egress[0].from_port),
               v.ip_permissions_egress[0].ip_ranges[0].cidr_ip
      ]);
      v.ip_permissions.shift();
      v.ip_permissions_egress.shift();
      var inbound =  v.ip_permissions;
      var outbound = v.ip_permissions_egress;
      if(inbound.length > outbound.length){
        inbound.forEach(function(v,index){
            if(outbound.length > index){
              body.push(['','',
                    v.user_id_group_pairs,
                    v.ip_protocol,
                    is_null_port(v.from_port.toString()),
                    v.ip_ranges[0].cidr_ip,
                    outbound[index].user_id_group_pairs,
                    is_null_port(outbound[index].from_port),
                    outbound[index].ip_protocol,
                    outbound[index].ip_ranges[0].cidr_ip
                  ]);
            }else{
              body.push(['','',
                    v.user_id_group_pairs,
                    v.ip_protocol,
                    is_null_port(v.from_port.toString()),
                    v.ip_ranges[0].cidr_ip,
                    '',
                    '',
                    '',
                    ''
                  ]);
            }

        });
      }else{
        outbound.forEach(function(v,index){
            if(inboound.length > index){
              body.push(['','',
                    v.user_id_group_pairs,
                    v.ip_protocol,
                    is_null_port(v.from_port.toString()),
                    v.ip_ranges[0].cidr_ip,
                    inboound[index].user_id_group_pairs,
                    is_null_port(inboound[index].from_port),
                    inboound[index].ip_protocol,
                    inboound[index].ip_ranges[0].cidr_ip
                  ]);
            }else{
              body.push(['','',
                    v.user_id_group_pairs,
                    v.ip_protocol,
                    is_null_port(v.from_port.toString()),
                    v.ip_ranges[0].cidr_ip,
                    '',
                    '',
                    '',
                    ''
                  ]);
            }

        });
      }
  }
  );
    console.log(body);
return body;
}




function build_in_out_bound(inbound, outbound){
 var build = [];
    if(inbound.length > outbound.length){
      inbound.forEach(function(v,index){
          if(index !== 0 && outbound.length > index){
            build.push(['','',
                  v.user_id_group_pairs,
                  v.ip_protocol,
                  v.from_port.toString(),
                  v.ip_ranges[0].cidr_ip,
                  outbound[index].user_id_group_pairs,
                  outbound[index].from_port,
                  outbound[index].ip_protocol,
                  outbound[index].ip_ranges[0].cidr_ip
                ]);
          }else if (index !==0 && index > outbound.length) {
            build.push(['','',
                  v.user_id_group_pairs,
                  v.ip_protocol,
                  v.from_port.toString(),
                  v.ip_ranges[0].cidr_ip,
                  '',
                  '',
                  '',
                  ''
                ]);
          }
      });
    }
  console.log(build);
  return build;
}
