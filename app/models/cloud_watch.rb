#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class CloudWatch

  #TODO tmr no frecking idea
  def initialize(infra)
    access_key_id       = infra.access_key
    secret_access_key   = infra.secret_access_key
    region              = infra.region

    @cloud_watch = AWS::CloudWatch.new(
      access_key_id:     access_key_id,
      secret_access_key: secret_access_key,
      region:            region,
    ).client
  end

  #CloudWatch Networkin Outの情報を取得
  #Google Chartでグラフ表示する為フォーマティングして
  #値を返す
  # @param {String} physical_id
  # @return {Array<Array>} [[String, Float, Float, Float]] time, in avg, out avg, sum
  def get_networkinout(physical_id)
    get = -> (name) {
      now = Time.zone.now
      return @cloud_watch.get_metric_statistics(
        namespace:   'AWS/EC2',
        metric_name: name,
        statistics:  ['Average'],
        dimensions:  [{name: 'InstanceId', value: physical_id}],
        start_time:  (now - 1.hour).iso8601,
        end_time:    now.iso8601,
        period:      60,
      )
    }

    # data.datapoints === [{timestamp: Time, average: Float}, ...]
    in_data  = get.('NetworkIn')
    out_data = get.('NetworkOut')

    res = []
    in_data.datapoints.zip(out_data.datapoints).each do |in_, out|
      time = (in_[:timestamp].localtime).strftime("%H:%M")
      in_avg  = in_[:average]
      out_avg = out[:average]
      sum = in_avg + out_avg
      res.push([time, in_avg, out_avg, sum])
    end
    return res.sort.reverse
  end
end
