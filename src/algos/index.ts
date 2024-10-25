import { AppContext } from '../config'
import {
  QueryParams,
  OutputSchema as AlgoOutput,
} from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { ObjectId } from "mongojs"
import { LabelSource } from './LabelSource'
import { InvalidRequestError } from '@atproto/xrpc-server'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {}


const feeds = require("./feeds.json")
feeds.forEach(tFeed => {
  const labelSource = new LabelSource(tFeed.labelValue, tFeed.labelerSourceDID, tFeed.excludeLabelValues)
  const handler = async (ctx: AppContext | undefined, params: QueryParams) => {
    let res: any = []

    let cursor: ObjectId | undefined
    if (params.cursor) {
      try {
        cursor = new ObjectId(params.cursor)
      } catch (error) {
        throw new InvalidRequestError('malformed cursor')
      }
    }
    res = await labelSource.getLabels(cursor, params.limit)

    const feed = res.map((row) => ({
      post: row.uri,
    }))

    const last = res.at(-1)
    if (last) {
      cursor = last._id.toString()
    }

    return {
      cursor,
      feed,
    }
  }
  algos[tFeed.feedShortname] = handler
})


export default algos
