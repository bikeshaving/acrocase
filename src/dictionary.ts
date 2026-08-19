// The dictionary is data, so it lives in dictionary.json. This module exists
// to give it a package entry of its own, so consumers can read the acronym
// list without going through the rule.
import dictionary from './dictionary.json' with { type: 'json' };

export default dictionary;
