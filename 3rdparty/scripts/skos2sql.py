#!/usr/bin/python

# This script parses a provided input file (in skos xml, rdf format) and inserts
# the entries into a (hardcoded) database

import xml.etree.ElementTree as et
import psycopg2
import datetime
import sys
import getopt

def main(argv):
    inputFile = False
    try:
        opts, args = getopt.getopt(argv, "hf:", ["file="])
    except getopt.GetoptError:
        print 'Error: usage: skos2sql.py -f <filename>'
        print 'OR'
        print 'usage: skos2sql.py --file <filename>'
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print 'usage: skos2sql.py -f <filename>'
            print 'OR'
            print 'usage: skos2sql.py --file <filename>'
            sys.exit()
        elif opt in ('-f', '--file'):
            inputFile = True
            filename = arg
    if not inputFile:
        print 'Error: Please provide an input file (in rdf format)'
        sys.exit(1)

    try:
        conn = psycopg2.connect("host='localhost' port='5432' dbname='thesaurex' user='postgres' password=''")
        cur = conn.cursor()
    except:
        print "Could not connect to database!"
        sys.exit(2)

    tree = et.parse(filename)
    root = tree.getroot()
    ns = {'base': 'http://www.w3.org/2002/07/owl',
        'xml': 'http://www.w3.org/XML/1998/namespace',
        'xmlns': 'http://www.w3.org/2002/07/owl#',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'owl': 'http://www.w3.org/2002/07/owl#',
        'xsd': 'http://www.w3.org/2001/XMLSchema#',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'skos': 'http://www.w3.org/2004/02/skos/core#'}
    languages = {
        'de': 1,
        'en': 2,
        'es': 3
    }

    def getAttribTag(namespace, label):
        return '{' + ns[namespace] + '}' + label

    topConcepts = {}
    broaderDict = {}
    broaders = []
    namedInd = root.findall('xmlns:NamedIndividual', ns)
    descs = root.findall('rdf:Description', ns);
    children = namedInd + descs
    for child in children:
        datestr = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        uri = child.attrib[getAttribTag('rdf', 'about')]
        typ = child.find('rdf:type', ns)
        if typ is not None:
            typ = typ.attrib[getAttribTag('rdf', 'resource')]
            if typ.endswith("core#ConceptScheme"):
                for topConcept in child.findall('skos:hasTopConcept', ns):
                    topConcepts[topConcept.attrib[getAttribTag('rdf', 'resource')]] = 1
                continue
        inScheme = ""
        tmpScheme = child.find('skos:inScheme', ns)
        if tmpScheme is not None:
            inScheme = tmpScheme.attrib[getAttribTag('rdf', 'resource')]
        # check if entry already exists
        # print 'Adding ' + uri
        query = "SELECT id FROM th_concept WHERE concept_url = %s"
        data = (uri, )
        cur.execute(query, data)
        conceptId = None
        if cur.rowcount > 0:
            conceptId = cur.fetchone()[0]
            continue
        # insert if it does not exist
        query = "INSERT INTO th_concept (lasteditor, concept_url, concept_scheme) VALUES ('postgres', %s, %s) RETURNING id;"
        data = (uri, inScheme, )
        cur.execute(query, data)
        conceptId = cur.fetchone()[0]
        broaderDict[uri] = conceptId
        for altLabel in child.findall('skos:altLabel', ns):
            query = "INSERT INTO th_concept_label (lasteditor, label, concept_id, language_id, concept_label_type) VALUES ('postgres', %s, %s, %s, 2);"
            data = (altLabel.text, conceptId, languages[altLabel.attrib[getAttribTag('xml', 'lang')]], )
            cur.execute(query, data)
        for prefLabel in child.findall('skos:prefLabel', ns):
            query = "INSERT INTO th_concept_label (lasteditor, label, concept_id, language_id, concept_label_type) VALUES ('postgres', %s, %s, %s, 1);"
            data = (prefLabel.text, conceptId, languages[prefLabel.attrib[getAttribTag('xml', 'lang')]], )
            cur.execute(query, data)
        for broader in child.findall('skos:broader', ns):
            broaders.append({ 'src': uri, 'dst': broader.attrib[getAttribTag('rdf', 'resource')] })
        #narrowers = []
        #for narrower in child.findall('skos:narrower', ns):
        #    narrowers.append(narrower.attrib[getAttribTag('rdf', 'resource')])
    for broader in broaders:
        srcId = broaderDict[broader['src']]
        dstId = broaderDict[broader['dst']]
        query = "INSERT INTO th_broaders (broader_id, narrower_id) VALUES (%s, %s);"
        data = (dstId, srcId, )
        cur.execute(query, data)
    for topConcept in topConcepts:
        query = "UPDATE th_concept SET is_top_concept = true WHERE concept_url = %s;"
        data = (topConcept, )
        cur.execute(query, data)
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    main(sys.argv[1:])
