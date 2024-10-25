import { default as mongojs } from "mongojs"
import { ObjectId } from "mongojs"
const labelCollection = mongojs("bsnetworkcache").collection("labels")

export class LabelSource {
	labelValue: string
	labelSource: string
	excludeSources: string[]
	constructor(value = "label-name", source, excludeValues = ["exclude-feed"]) {
		this.labelValue = value
		this.labelSource = source
		this.excludeSources = excludeValues
	}
	getLabels(cursor: ObjectId | undefined, limit: number = 20): Promise<Array<any>> {
		return new Promise((resolve, reject) => {
			const searchDocument: {
				_id?: { $lt: ObjectId }
				src: string
				val: string
			} = {
				src: this.labelSource, val: this.labelValue,
			}
			if (cursor) {
				searchDocument._id = { $lt: cursor }
			}
			labelCollection.find(searchDocument).sort({ _id: -1 }).limit(limit, async (err, labels: { uri: string, _id: ObjectId }[]) => {
				if (err) return reject(err)
				if (!labels.length) {
					resolve([])
					return
				}
				const excludeSearchDocument = {
					src: this.labelSource, val: { $in: this.excludeSources },
					uri: { $in: labels.map((label: { uri: string, _id: ObjectId }) => label.uri).concat([...new Set(labels.map(label => label.uri.substring(5).split("/")[0]))]) }
				}
				labelCollection.find(excludeSearchDocument, (err, excludeLabels: { uri: string, _id: ObjectId }[]) => {
					if (err) return reject(err)
					labels = labels.filter(label => !excludeLabels.some(excludeLabel => label.uri.includes(excludeLabel.uri)))
					resolve(labels)
				})
			})
		})
	}
}
